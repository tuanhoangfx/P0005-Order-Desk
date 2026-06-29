# CzP Seller Sheets → P0005 Order Desk

Source workbook: [CzP Seller](https://docs.google.com/spreadsheets/d/10cTORpWxfp9PfuZ95gbpBhiurIM0yOose4oU5QSC-mY/edit)

| Tab (gid) | Role | ~Rows |
|-----------|------|-------|
| `🤵 Buyer` (404442643) | Customer registry | CS01xxx buyers, tiers, channel IDs |
| `📈 Order List` (91093553) | Order pipeline | OI27xxxx orders, product, price, fulfillment |

## Buyer sheet → `order_desk_customers`

| Sheet column | Supabase field | Notes |
|--------------|----------------|-------|
| B `🆔 Buyer ID` | `external_buyer_id` | e.g. `CS01350` — natural upsert key |
| C `📛 Buyer Name` | `display_name` | Primary label |
| D `🤵 Buyer Info` | `metadata.buyer_info` | Long display string |
| E `🏆 Tier` | `tier` | Emoji tier (🥉…) or seller group |
| F `✍️ Notes` | `notes` | Free text |
| G `🆔 Facebook ID` | `metadata.facebook_id` | Link P0016 Messenger threads |
| H `🆔 Tele ID` | `metadata.telegram_id` | Link P0025 / TeleGroup |
| I `🆔 Zalo/Phone` | `phone` | Zalo phone or handle |
| J `🎭 Seller` | `seller_code` | e.g. `🟢 S004`, `🟣 S001` |
| K–M channel flags | `metadata.channels` | `{ zalo, messenger, telegram }` booleans |
| N `🤝 Commission` | `commission_pct` | e.g. `10` → `10.00` |

**P0020 link:** match `metadata.facebook_id` / phone to `twofa_accounts` when importing — store UUID in `order_desk_orders.twofa_account_id` only (no secret copy).

**P0016 link:** resolve `chat_bot_id` + `chat_thread_id` from inbox thread whose peer id matches Facebook ID — store on order row per `CROSS-TOOL-CONTRACT.md`.

## Order List sheet → `order_desk_orders`

| Sheet column | Supabase field | Notes |
|--------------|----------------|-------|
| Status emoji (🟢/🟡) | `sheet_status` + `status` | Map 🟢→`fulfilled`, 🟡→`pending` |
| `🆔 Order ID` | `external_order_id` | e.g. `OI2706012` — upsert key |
| `📅 Date` | `created_at` (parse) | DD/MM/YY from sheet |
| `📛 Product Name` | `product_name` | Also `title` for search |
| `🆔 Buyer ID` | `customer_id` | FK via `external_buyer_id` lookup |
| `🛒 Qty` | `qty` | Integer |
| `💰 Price` | `amount_cents` | Strip `.` thousands → cents (VND) |
| `📜 Order Details` | `notes` + `metadata.credentials` | **Sensitive** — same handling as P0020 vault |
| Row index | `sheet_row_key` | `buyer:{gid}:{row}` for idempotent sync |

## Integration phases (recommended)

### Phase A — Read-only mirror (MVP)
1. Google Apps Script or service account reads both tabs nightly.
2. Upsert into Supabase via `external_buyer_id` / `external_order_id`.
3. P0005 directory shows mirrored rows; Sheets remains write UI short-term.

### Phase B — Bidirectional status
1. Order status changes in P0005 write back `sheet_status` column only.
2. Credentials stay in P0020 vault; sheet gets vault link token not raw pass.

### Phase C — Deprecate sheet UI
1. CRUD in P0005 becomes SSOT.
2. Sheet export for CTV reporting only.

## Data quality notes (from sample rows)

- Buyer tab rows 4–19: sparse placeholder rows (`CS01350` block) — skip import when `display_name` empty.
- Column drift: some rows put seller in tier column — normalize via `seller_code` regex `S\d{3}`.
- Order price uses locale formatting (`4.200` = 4200 VND) — parser must strip thousand separators.
- Duplicate buyer names with different CS ids — always key on `external_buyer_id`, not name.

## Script stub (next sprint)

```
scripts/import-czp-seller-sheet.mjs
  --sheet 10cTORpWxfp9PfuZ95gbpBhiurIM0yOose4oU5QSC-mY
  --tabs buyer,orders
  --dry-run
```

Requires Google service account JSON in `.env.shared` (`GOOGLE_SHEETS_SA_JSON` or existing Drive creds).
