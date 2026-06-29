# Changelog — P0005 Order Desk

## 2026-06-29 - Production release crm.infi.io.vn

- Version: `0.1.0`
- Timestamp: 2026-06-29T00:00:00.000Z
- Release: https://crm.infi.io.vn

### Added

- Hub-UI directory screens (Customers / Orders / Overview) with Notify · Log · Settings header ops.
- Supabase SSOT (`order_desk_customers`, `order_desk_orders`) + one-time sheet seed import.
- CRUD, card/table views, time-range filters, bulk order status, Order ↔ Customer deep links.
- Table scroll fix + buyer column on Orders directory.

### Deploy

- Vercel production: `crm.infi.io.vn` (DNS A → 76.76.21.21).
- Supabase project: `bklxcjrkhrevdcqjscku` (Data Box plane).

Version: 0.1.0 → 0.1.0

## 0.1.0 — 2026-06-27

### Added

- Recycled product code **P0005** from retired Zalo AI Bot (superseded by P0016).
- `tool.manifest.json`, architecture + **cross-tool contract** (P0020 Account + P0016 inbox links).
- Supabase migration `order_desk_customers`, `order_desk_orders` with RLS.
- Smoke script `scripts/smoke-order-desk.mjs`.

### Notes

- **P0025** remains **Infi TeleGroup** — do not use for Order Desk.
