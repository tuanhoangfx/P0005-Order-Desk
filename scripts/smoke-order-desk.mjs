#!/usr/bin/env node
/**
 * Smoke — P0005 Order Desk scaffold.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "tool.manifest.json"), "utf8"));
const migration = path.join(
  root,
  "supabase/migrations/20260627100000_order_desk_customers_orders.sql",
);
const contract = path.join(root, "docs/CROSS-TOOL-CONTRACT.md");

const checks = [
  ["code", manifest.code === "P0005"],
  ["id", manifest.id === "order-desk"],
  ["migration", fs.existsSync(migration)],
  ["contract", fs.existsSync(contract)],
  ["customers screen", manifest.uiScreens?.some((s) => s.screen === "customers")],
  ["orders screen", manifest.uiScreens?.some((s) => s.screen === "orders")],
  ["p0016 noMessageSync", manifest.integrations?.p0016?.noMessageSync === true],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(ok ? "OK" : "FAIL", name);
  if (!ok) failed += 1;
}

process.exit(failed ? 1 : 0);
