import type { SupabaseClient } from "@supabase/supabase-js";

const SHEET_ID = "10cTORpWxfp9PfuZ95gbpBhiurIM0yOose4oU5QSC-mY";
const BUYER_GID = "404442643";
const ORDER_GID = "91093553";
const CHUNK = 100;

function norm(v: unknown) {
  const s = String(v ?? "").trim();
  if (!s || s === "undefined" || s === "null") return "";
  return s;
}

function stripEmojiPrefix(v: unknown) {
  return norm(v).replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/gu, "").trim();
}

function stripThousands(raw: unknown) {
  const s = norm(raw);
  if (!s) return null;
  const cleaned = s.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseDateToIso(raw: unknown) {
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

function mapOrderStatus(sheetStatusEmoji: string, detailsText: string) {
  const raw = `${sheetStatusEmoji} ${detailsText}`.toLowerCase();
  if (raw.includes("🟢")) return "fulfilled";
  if (raw.includes("🟡")) return "pending";
  if (raw.includes("cancel") || raw.includes("hủy")) return "cancelled";
  return "draft";
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
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

function parseCsvToMatrix(text: string) {
  const rows: string[][] = [];
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    rows.push(parseCsvLine(raw));
  }
  return rows;
}

function findHeaderIndex(lines: string[][], mustHave: string[]) {
  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    const low = lines[i].map((c) => stripEmojiPrefix(c).toLowerCase());
    if (mustHave.every((k) => low.some((c) => c.includes(k)))) return i;
  }
  return -1;
}

function pickIndexMap(headerRow: string[], wanted: Record<string, string[]>) {
  const low = headerRow.map((c) => stripEmojiPrefix(c).toLowerCase());
  const idx: Record<string, number> = {};
  for (const [key, needles] of Object.entries(wanted)) {
    idx[key] = low.findIndex((c) => needles.some((n) => c.includes(n)));
  }
  return idx;
}

async function fetchSheetCsv(gid: string) {
  const exportUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${encodeURIComponent(gid)}`;
  const res = await fetch(exportUrl);
  if (!res.ok) throw new Error(`Sheet CSV HTTP ${res.status}`);
  return res.text();
}

async function upsertChunks(
  supabase: SupabaseClient,
  table: "order_desk_customers" | "order_desk_orders",
  rows: Record<string, unknown>[],
  onConflict: string,
) {
  let upserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    const { data, error } = await supabase.from(table).upsert(batch, { onConflict }).select("id");
    if (error) throw error;
    upserted += data?.length ?? 0;
  }
  return upserted;
}

export type SheetSeedImportResult = {
  buyers: { parsed: number; upserted: number };
  orders: { parsed: number; upserted: number };
};

/** One-time seed from CzP Seller Google Sheets → signed-in user's Order Desk tables. */
export async function runSheetSeedImport(
  supabase: SupabaseClient,
  userId: string,
): Promise<SheetSeedImportResult> {
  const buyerCsv = await fetchSheetCsv(BUYER_GID);
  const buyerMatrix = parseCsvToMatrix(buyerCsv);
  const buyerHeaderIndex = findHeaderIndex(buyerMatrix, ["buyer id", "buyer name"]);
  if (buyerHeaderIndex < 0) throw new Error("Buyer sheet header not found");
  const buyerHeader = buyerMatrix[buyerHeaderIndex];
  const buyerIdx = pickIndexMap(buyerHeader, {
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

  const byBuyerId = new Map<string, Record<string, unknown>>();
  for (let r = buyerHeaderIndex + 1; r < buyerMatrix.length; r++) {
    const row = buyerMatrix[r] ?? [];
    const externalBuyerId = norm(row[buyerIdx.buyerId] ?? "");
    const displayName = stripEmojiPrefix(row[buyerIdx.buyerName] ?? "");
    if (!externalBuyerId || !displayName) continue;

    const sellerCodeRaw = stripEmojiPrefix(row[buyerIdx.seller] ?? "");
    const tierRaw = stripEmojiPrefix(row[buyerIdx.tier] ?? "");
    const sellerCode = sellerCodeRaw || (tierRaw.match(/\bS\d{3}\b/i)?.[0] ?? null);
    const tier = tierRaw || null;
    const commissionRaw = stripEmojiPrefix(row[buyerIdx.commission] ?? "");
    const commissionPct = commissionRaw ? Number(commissionRaw.replace(/[^\d.]/g, "")) : null;
    const commission = Number.isFinite(commissionPct ?? NaN) ? commissionPct : null;

    byBuyerId.set(externalBuyerId, {
      user_id: userId,
      display_name: displayName,
      phone: stripEmojiPrefix(row[buyerIdx.zaloPhone] ?? "") || null,
      email: null,
      tags: [],
      notes: norm(row[buyerIdx.notes] ?? "") || null,
      external_buyer_id: externalBuyerId,
      tier,
      seller_code: sellerCode ? String(sellerCode).trim() : null,
      commission_pct: commission,
      metadata: {
        buyer_info: norm(row[buyerIdx.buyerInfo] ?? ""),
        facebook_id: stripEmojiPrefix(row[buyerIdx.facebookId] ?? ""),
        telegram_id: stripEmojiPrefix(row[buyerIdx.teleId] ?? ""),
        channels: {
          zalo: Boolean(stripEmojiPrefix(row[buyerIdx.zaloFlag] ?? "")),
          messenger: Boolean(stripEmojiPrefix(row[buyerIdx.messFlag] ?? "")),
          telegram: Boolean(stripEmojiPrefix(row[buyerIdx.teleFlag] ?? "")),
        },
        sheet: { sheet_id: SHEET_ID, gid: BUYER_GID, row_index: r + 1 },
      },
    });
  }

  const buyerRows = [...byBuyerId.values()];
  const buyersUpserted = buyerRows.length
    ? await upsertChunks(supabase, "order_desk_customers", buyerRows, "user_id,external_buyer_id")
    : 0;

  const orderCsv = await fetchSheetCsv(ORDER_GID);
  const orderMatrix = parseCsvToMatrix(orderCsv);
  const orderHeaderIndex = findHeaderIndex(orderMatrix, ["order id", "buyer id"]);
  if (orderHeaderIndex < 0) throw new Error("Order sheet header not found");
  const orderHeader = orderMatrix[orderHeaderIndex];
  const orderIdx = pickIndexMap(orderHeader, {
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

  const { data: customers, error: custErr } = await supabase
    .from("order_desk_customers")
    .select("id, external_buyer_id")
    .eq("user_id", userId)
    .not("external_buyer_id", "is", null);
  if (custErr) throw custErr;
  const buyerToCustomerId = new Map(
    (customers ?? []).map((c) => [String(c.external_buyer_id), c.id as string]),
  );

  const byOrderId = new Map<string, Record<string, unknown>>();
  for (let r = orderHeaderIndex + 1; r < orderMatrix.length; r++) {
    const row = orderMatrix[r] ?? [];
    const externalOrderId = norm(row[orderIdx.orderId] ?? "");
    if (!externalOrderId) continue;
    const externalBuyerId = norm(row[orderIdx.buyerId] ?? "");
    const productName = stripEmojiPrefix(row[orderIdx.product] ?? "") || null;
    const dateIso = parseDateToIso(row[orderIdx.date] ?? "");
    const details = norm(row[orderIdx.details] ?? "");
    const status = mapOrderStatus(String(row[orderIdx.status] ?? ""), details);
    const price = stripThousands(row[orderIdx.price] ?? "");
    const amountCents = price == null ? null : Math.round(price * 100);
    const qty = stripThousands(row[orderIdx.qty] ?? "");

    const sheetRowKey = `czp-seller:${ORDER_GID}:${r + 1}`;

    byOrderId.set(externalOrderId, {
      user_id: userId,
      customer_id: externalBuyerId ? buyerToCustomerId.get(externalBuyerId) ?? null : null,
      status,
      sheet_status: stripEmojiPrefix(row[orderIdx.status] ?? "") || null,
      amount_cents: amountCents,
      currency: "VND",
      title: productName,
      product_name: productName,
      qty: qty == null ? null : Math.max(0, Math.round(qty)),
      notes: details ? details.slice(0, 2000) : null,
      external_order_id: externalOrderId,
      sheet_row_key: `czp-seller:${ORDER_GID}:${r + 1}`,
      created_at: dateIso ?? undefined,
      metadata: {
        tier: stripEmojiPrefix(row[orderIdx.tier] ?? ""),
        seller_code: stripEmojiPrefix(row[orderIdx.seller] ?? ""),
        sheet: { sheet_id: SHEET_ID, gid: ORDER_GID, row_index: r + 1 },
        raw_details: details,
      },
    });
  }

  const orderRows = [...byOrderId.values()];
  if (orderRows.length) {
    const { error: delErr } = await supabase.from("order_desk_orders").delete().eq("user_id", userId);
    if (delErr) throw delErr;
  }
  const ordersUpserted = orderRows.length
    ? await upsertChunks(supabase, "order_desk_orders", orderRows, "user_id,external_order_id")
    : 0;

  return {
    buyers: { parsed: buyerRows.length, upserted: buyersUpserted },
    orders: { parsed: orderRows.length, upserted: ordersUpserted },
  };
}
