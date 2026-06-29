#!/usr/bin/env node
/**
 * Apply Order Desk migration to Data Box Supabase (bklxcjrkhrevdcqjscku).
 * Usage: node scripts/apply-order-desk-migrations-api.mjs [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runMgmtDbQuery } from "../../scripts/lib/supabase-mgmt-query.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const projectRef = "bklxcjrkhrevdcqjscku";
const dryRun = process.argv.includes("--dry-run");
const migrationFiles = [
  "supabase/migrations/20260627100000_order_desk_customers_orders.sql",
  "supabase/migrations/20260627120000_order_desk_sheet_fields.sql",
  "supabase/migrations/20260629150700_order_desk_sheet_sources_and_uniques.sql",
  "supabase/migrations/20260629152000_order_desk_orders_metadata.sql",
];

for (const rel of migrationFiles) {
  const file = path.join(root, rel);
  const sql = fs.readFileSync(file, "utf8");
  if (dryRun) {
    console.log("DRY RUN", rel, `(${sql.length} chars)`);
    continue;
  }
  console.log(`Applying ${rel}…`);
  try {
    await runMgmtDbQuery(projectRef, sql);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("already exists")) {
      console.log(`SKIP ${rel} (already applied)`);
      continue;
    }
    throw error;
  }
}

if (dryRun) process.exit(0);
console.log("OK order_desk migrations");
