# P0005 Order Desk

Customer + order management for the Infi tool workspace.

**Recycled code:** `P0005` (retired Zalo AI Bot → merged into **P0016 Chat Center**).  
**Not P0025:** code `P0025` is **Infi TeleGroup** (Telegram group automation).

## Links

| Tool | Role |
|------|------|
| **P0020 Data Box** | Account vault (`twofa_accounts`) — which service login fulfilled the order |
| **P0016 Chat Center** | Inbox deep link (`bot` + `thread`) — no message sync |
| **P0004 Tool Hub** | Auth + navigation |

See [docs/CROSS-TOOL-CONTRACT.md](docs/CROSS-TOOL-CONTRACT.md).

## Dev

```bash
cd Tool/P0005-Order-Desk
node ../scripts/ensure-dev-product.cjs P0005 --open
```

Port: **3005**

## Migrations

```bash
pnpm db:migrate:api
```

Requires `E:\Dev\.env.shared` with Data Box Supabase service token (same plane as P0020).

## Status

**v0.1 scaffold** — manifest, schema, contract. Hub-UI shell (Customers / Orders tabs) next.
