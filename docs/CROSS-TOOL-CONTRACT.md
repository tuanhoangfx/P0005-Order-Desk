# Cross-tool contract — P0005 ↔ P0020 ↔ P0016

**Status:** Draft v0.1  
**Owner:** P0005 Order Desk  
**Principle:** Reference IDs + deep links only. **No message or credential sync.**

---

## 1. Identity plane

| Plane | Project | Used for |
|-------|---------|----------|
| Hub identity | `fmnrafpzctuhxjaaomzt` (P0004) | Login, `profiles`, `tool_access` |
| Order Desk data | `bklxcjrkhrevdcqjscku` (P0020 Data Box project) | `order_desk_customers`, `order_desk_orders` |
| Account vault | `zurfouqanjcubgneuctp` (P0020 2FA plane) | `twofa_accounts` — read reference only |

All Order Desk rows are scoped by `user_id` = Hub auth user UUID (same as P0020 notes/tasks).

---

## 2. Entity IDs (P0005)

### `order_desk_customers`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `user_id` | `uuid` FK | Hub user |
| `display_name` | `text` | Required |
| `phone` | `text` | Optional, indexed |
| `email` | `text` | Optional |
| `tags` | `text[]` | Workspace tags |
| `notes` | `text` | Free-form CRM note (not P0020 Notes entity) |
| `metadata` | `jsonb` | Extension fields |

### `order_desk_orders`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | |
| `customer_id` | `uuid` FK → customers | |
| `status` | `text` | `draft` \| `pending` \| `paid` \| `fulfilled` \| `cancelled` |
| `amount_cents` | `bigint` | Optional |
| `currency` | `text` | Default `VND` |
| `twofa_account_id` | `uuid` | **P0020** `twofa_accounts.id` (no FK cross-DB) |
| `chat_bot_id` | `text` | **P0016** bot id e.g. `Z0001`, `pin-lithium` |
| `chat_thread_id` | `text` | **P0016** thread id (numeric Zalo or `messenger_*`) |
| `chat_channel` | `text` | `zalo` \| `messenger` |
| `sheet_source_id` | `uuid` | Optional P0020 `sheet_sources.id` |
| `sheet_row_key` | `text` | Import lineage |
| `title` | `text` | Short label |
| `notes` | `text` | |

**Rule:** P0005 never stores message bodies. Chat context = link only.

---

## 3. P0020 Account vault link

### What `twofa_account_id` means

Points to a **service login row** in P0020 tab Account (`twofa_accounts`): Capcut account, Zalo nick vault entry, payment gateway login, etc.

### Resolution (client)

```ts
// Read-only from P0020 2FA Supabase client
const account = await twofaClient
  .from("twofa_accounts")
  .select("id, service, account, browser, status")
  .eq("id", order.twofa_account_id)
  .maybeSingle();
```

### UI actions

| From | Action | Target |
|------|--------|--------|
| Order row | "Open account" | P0020 `/twofa?highlight={twofa_account_id}` |
| P0020 Account row | "Orders" (future) | P0005 `/orders?twofa_account_id={id}` |

### Constraints

- No copy of `password`, `secret`, or TOTP into P0005.
- If vault row deleted → order keeps `twofa_account_id` as orphan; UI shows "Account removed".

---

## 4. P0016 Chat link

### What `chat_bot_id` + `chat_thread_id` mean

Opaque reference to an existing inbox thread in P0016 worker/JSONL. Used for "open conversation" only.

### Deep link URL (console)

```
https://chathub.infi.io.vn/inbox?bot={chat_bot_id}&thread={chat_thread_id}
```

Local dev:

```
http://127.0.0.1:5186/inbox?bot=Z0001&thread=8416488809531141498
```

Messenger thread ids may contain `_` — always URL-encode.

### UI actions

| From | Action | Target |
|------|--------|--------|
| Order row | "Open chat" | P0016 inbox deep link |
| P0016 thread header (future) | "Create order" | P0005 `/orders/new?bot=&thread=&channel=` |

### Constraints

- **No webhook** from P0016 → P0005 on new messages.
- **No duplicate** of `MessageRow` in Order Desk DB.
- Optional future: manual "Attach thread" button stores refs once.

### `chat_channel` enum

| Value | When |
|-------|------|
| `zalo` | `chat_bot_id` is a Zalo bot and thread id is numeric |
| `messenger` | thread id starts with `messenger_` or bot is messenger-only |

---

## 5. P0020 Sheet import (optional)

For legacy Google Sheet order lists:

| Field | Purpose |
|-------|---------|
| `sheet_source_id` | P0020 `sheet_sources.id` |
| `sheet_row_key` | Stable row hash or primary key column value |

One-time import script: `scripts/import-sheet-orders.mjs` (future). No live sync unless explicit job.

---

## 6. Auth flow

1. User signs in via P0004 Hub identity (`signInWorkspaceDual` pattern from P0020).
2. P0005 mirror session on Data Box plane (`bklxcjrkhrevdcqjscku`).
3. RLS: `user_id = auth.uid()` on all `order_desk_*` tables.
4. P0020 vault reads use separate 2FA client session (already established in Data Box app).

---

## 7. Versioning

| Contract version | Date | Change |
|------------------|------|--------|
| `0.1` | 2026-06-27 | Initial IDs + deep links |

Breaking changes require bump + migration note in P0005 CHANGELOG.
