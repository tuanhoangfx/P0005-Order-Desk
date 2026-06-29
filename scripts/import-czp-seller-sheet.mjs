#!/usr/bin/env node
/**
 * Import CzP Seller Google Sheets (Buyer + Order List) → Supabase (Data Box plane).
 *
 * Usage:
 *   node scripts/import-czp-seller-sheet.mjs --dry-run
 *   node scripts/import-czp-seller-sheet.mjs --apply
 *
 * Env (from ../../.env.shared):
 *   DATABOX_SUPABASE_URL
 *   DATABOX_SUPABASE_SERVICE_ROLE
 *
 * Optional:
 *   ORDER_DESK_IMPORT_EMAIL=czpgo@outlook.com
 *   ORDER_DESK_SHEET_ID=10cTORpWxfp9PfuZ95gbpBhiurIM0yOose4oU5QSC-mY
 *   ORDER_DESK_BUYER_GID=404442643
 *   ORDER_DESK_ORDER_GID=91093553
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const dryRun = args.includes("--dry-run") || !apply;

function loadEnvFile(p) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    if (!process.env[key]) process.env[key] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  }
}

loadEnvFile(path.resolve(root, "../../.env.shared"));
loadEnvFile(path.resolve(root, ".env.local"));

const url = (process.env.DATABOX_SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = process.env.DATABOX_SUPABASE_SERVICE_ROLE || "";
const adminEmail = process.env.ORDER_DESK_IMPORT_EMAIL || "czpgo@outlook.com";

const sheetId = process.env.ORDER_DESK_SHEET_ID || "10cTORpWxfp9PfuZ95gbpBhiurIM0yOose4oU5QSC-mY";
const buyerGid = process.env.ORDER_DESK_BUYER_GID || "404442643";
const orderGid = process.env.ORDER_DESK_ORDER_GID || "91093553";

if (!url || !serviceKey) {
  console.error("FAIL: missing DATABOX_SUPABASE_URL / DATABOX_SUPABASE_SERVICE_ROLE in .env.shared");
  process.exit(2);
}

const sbAdmin = createClient(url, serviceKey, { auth: { persistSession: false } });

function parseCsvLine(line) {
  const cells = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i += 1;
        continue;
      }
      q = !q;
      continue;
    }
    if (ch === "," && !q) {
      cells.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  cells.push(cur);
  return cells.map((c) => String(c ?? "").trim());
}

function norm(v) {
  const s = String(v ?? "").trim();
  if (!s || s === "undefined" || s === "null") return "";
  return s;
}

function stripEmojiPrefix(v) {
  return norm(v).replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/gu, "").trim();
}

function stripThousands(raw) {
  const s = norm(raw);
  if (!s) return null;
  const cleaned = s.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseDateToIso(raw) {
  const s = norm(raw);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  const dd = m[1].padStart(2, "0");
  const mm = m[2].padStart(2, "0");
  let yy = m[3];
  if (yy.length === 2) yy = `20${yy}`;
  const HH = (m[4] ?? "00").padStart(2, "0");
  const MM = (m[5] ?? "00").padStart(2, "0");
  const iso = `${yy}-${mm}-${dd}T${HH}:${MM}:00.000Z`;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

function mapOrderStatus(sheetStatusEmoji, detailsText) {
  const raw = `${sheetStatusEmoji} ${detailsText}`.toLowerCase();
  if (raw.includes("🟢")) return "fulfilled";
  if (raw.includes("🟡")) return "pending";
  if (raw.includes("cancel") || raw.includes("hủy")) return "cancelled";
  return "draft";
}

async function fetchSheetCsv(gid) {
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${encodeURIComponent(gid)}`;
  const res = await fetch(exportUrl, { signal: AbortSignal.timeout(45000) });
  if (!res.ok) throw new Error(`Sheet CSV HTTP ${res.status}`);
  return res.text();
}

function findHeaderIndex(lines, mustHave) {
  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    const low = lines[i].map((c) => stripEmojiPrefix(c).toLowerCase());
    if (mustHave.every((k) => low.some((c) => c.includes(k)))) return i;
  }
  return -1;
}

function parseCsvToMatrix(text) {
  const rows = [];
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    rows.push(parseCsvLine(raw));
  }
  return rows;
}

async function resolveAdminUserId() {
  const { data, error } = await sbAdmin.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  const user = (data?.users ?? []).find((u) => (u.email ?? "").toLowerCase() === adminEmail.toLowerCase());
  if (!user?.id) throw new Error(`Admin user not found: ${adminEmail}`);
  return user.id;
}

function pickIndexMap(headerRow, wanted) {
  const low = headerRow.map((c) => stripEmojiPrefix(c).toLowerCase());
  const idx = {};
  for (const [key, needles] of Object.entries(wanted)) {
    const found = low.findIndex((c) => needles.some((n) => c.includes(n)));
    idx[key] = found;
  }
  return idx;
}

async function importBuyers(userId, sheetSourceId) {
  const csv = await fetchSheetCsv(buyerGid);
  const matrix = parseCsvToMatrix(csv);
  const headerIndex = findHeaderIndex(matrix, ["buyer id", "buyer name"]);
  if (headerIndex < 0) throw new Error("Buyer sheet header not found");
  const header = matrix[headerIndex];
  const idx = pickIndexMap(header, {
    buyerId: ["buyer id", "id"],
    buyerName: ["buyer name", "name"],
    buyerInfo: ["buyer info", "info"],
    tier: ["tier"],
    notes: ["notes"],
    facebookId: ["facebook id"],
    teleId: ["tele id", "telegram"],
    zaloPhone: ["zalo", "phone"],
    seller: ["seller"],
    zaloFlag: ["zalo"],
    messFlag: ["mess"],
    teleFlag: ["tele"],
    commission: ["commission"],
  });

  const byBuyerId = new Map();
  for (let r = headerIndex + 1; r < matrix.length; r++) {
    const row = matrix[r] ?? [];
    const externalBuyerId = norm(row[idx.buyerId] ?? "");
    const displayName = stripEmojiPrefix(row[idx.buyerName] ?? "");
    if (!externalBuyerId || !displayName) continue;

    const sellerCodeRaw = stripEmojiPrefix(row[idx.seller] ?? "");
    const tierRaw = stripEmojiPrefix(row[idx.tier] ?? "");
    const sellerCode = sellerCodeRaw || (tierRaw.match(/\bS\d{3}\b/i)?.[0] ?? null);
    const tier = tierRaw || null;

    const commissionRaw = stripEmojiPrefix(row[idx.commission] ?? "");
    const commissionPct = commissionRaw ? Number(commissionRaw.replace(/[^\d.]/g, "")) : null;
    const commission = Number.isFinite(commissionPct ?? NaN) ? commissionPct : null;

    const metadata = {
      buyer_info: norm(row[idx.buyerInfo] ?? ""),
      facebook_id: stripEmojiPrefix(row[idx.facebookId] ?? ""),
      telegram_id: stripEmojiPrefix(row[idx.teleId] ?? ""),
      channels: {
        zalo: Boolean(stripEmojiPrefix(row[idx.zaloFlag] ?? "")),
        messenger: Boolean(stripEmojiPrefix(row[idx.messFlag] ?? "")),
        telegram: Boolean(stripEmojiPrefix(row[idx.teleFlag] ?? "")),
      },
      sheet: {
        sheet_id: sheetId,
        gid: buyerGid,
        row_index: r + 1,
      },
    };

    byBuyerId.set(externalBuyerId, {
      user_id: userId,
      display_name: displayName,
      phone: stripEmojiPrefix(row[idx.zaloPhone] ?? "") || null,
      email: null,
      tags: [],
      notes: norm(row[idx.notes] ?? "") || null,
      external_buyer_id: externalBuyerId,
      tier,
      seller_code: sellerCode ? String(sellerCode).trim() : null,
      commission_pct: commission,
      metadata,
    });
  }

  const rows = [...byBuyerId.values()];

  console.log(JSON.stringify({ buyers: { parsed: rows.length, headerIndex } }, null, 2));
  if (dryRun) return { parsed: rows.length, upserted: 0 };
  if (!rows.length) return { parsed: 0, upserted: 0 };

  const { data, error } = await sbAdmin
    .from("order_desk_customers")
    .upsert(rows, { onConflict: "user_id,external_buyer_id" })
    .select("id");
  if (error) throw error;
  return { parsed: rows.length, upserted: data?.length ?? 0 };
}

async function importOrders(userId, sheetSourceId) {
  const csv = await fetchSheetCsv(orderGid);
  const matrix = parseCsvToMatrix(csv);
  const headerIndex = findHeaderIndex(matrix, ["order id", "buyer id"]);
  if (headerIndex < 0) throw new Error("Order sheet header not found");
  const header = matrix[headerIndex];
  const idx = pickIndexMap(header, {
    status: ["buyer information", "⏱", "status"],
    orderId: ["order id"],
    date: ["date"],
    product: ["product name", "product"],
    buyerId: ["buyer id"],
    tier: ["tier"],
    seller: ["seller"],
    qty: ["qty"],
    price: ["price"],
    details: ["order details", "details"],
  });

  const { data: customers, error: custErr } = await sbAdmin
    .from("order_desk_customers")
    .select("id, external_buyer_id")
    .eq("user_id", userId)
    .not("external_buyer_id", "is", null);
  if (custErr) throw custErr;
  const buyerToCustomerId = new Map((customers ?? []).map((c) => [String(c.external_buyer_id), c.id]));

  const byOrderId = new Map();
  for (let r = headerIndex + 1; r < matrix.length; r++) {
    const row = matrix[r] ?? [];
    const externalOrderId = norm(row[idx.orderId] ?? "");
    if (!externalOrderId) continue;
    const externalBuyerId = norm(row[idx.buyerId] ?? "");
    const productName = stripEmojiPrefix(row[idx.product] ?? "") || null;
    const dateIso = parseDateToIso(row[idx.date] ?? "");
    const details = norm(row[idx.details] ?? "");
    const status = mapOrderStatus(row[idx.status] ?? "", details);

    const price = stripThousands(row[idx.price] ?? "");
    const amountCents = price == null ? null : Math.round(price * 100);
    const qty = stripThousands(row[idx.qty] ?? "");

    const sheetRowKey = `czp-seller:${orderGid}:${r + 1}`;
    const metadata = {
      tier: stripEmojiPrefix(row[idx.tier] ?? ""),
      seller_code: stripEmojiPrefix(row[idx.seller] ?? ""),
      sheet: {
        sheet_id: sheetId,
        gid: orderGid,
        row_index: r + 1,
      },
      raw_details: details,
    };

    byOrderId.set(externalOrderId, {
      user_id: userId,
      customer_id: externalBuyerId ? buyerToCustomerId.get(externalBuyerId) ?? null : null,
      status,
      sheet_status: stripEmojiPrefix(row[idx.status] ?? "") || null,
      amount_cents: amountCents,
      currency: "VND",
      title: productName,
      product_name: productName,
      qty: qty == null ? null : Math.max(0, Math.round(qty)),
      notes: details ? details.slice(0, 2000) : null,
      external_order_id: externalOrderId,
      sheet_source_id: sheetSourceId,
      sheet_row_key: sheetRowKey,
      created_at: dateIso ?? undefined,
      metadata,
    });
  }

  const rows = [...byOrderId.values()];

  console.log(JSON.stringify({ orders: { parsed: rows.length, headerIndex } }, null, 2));
  if (dryRun) return { parsed: rows.length, upserted: 0 };
  if (!rows.length) return { parsed: 0, upserted: 0 };

  // Seed replace — avoid partial unique-index conflicts on sheet_row_key.
  const { error: delErr } = await sbAdmin.from("order_desk_orders").delete().eq("user_id", userId);
  if (delErr) throw delErr;

  const { data, error } = await sbAdmin
    .from("order_desk_orders")
    .upsert(rows, { onConflict: "user_id,external_order_id" })
    .select("id");
  if (error) throw error;
  return { parsed: rows.length, upserted: data?.length ?? 0 };
}

const userId = await resolveAdminUserId();
const buyersRes = await importBuyers(userId, null);
const ordersRes = await importOrders(userId, null);

console.log(
  JSON.stringify(
    {
      ok: true,
      dryRun,
      userEmail: adminEmail,
      sheetId,
      buyerGid,
      orderGid,
      buyers: buyersRes,
      orders: ordersRes,
    },
    null,
    2,
  ),
);
