# Architecture — P0005 Order Desk

## Why P0005 (not P0016 / P0020 / P0025)

| Option | Verdict |
|--------|---------|
| P0016 | Chat only — CRM out of scope |
| P0020 | Vault + workspace — mixing order DB with 2FA vault blurs security |
| P0025 | **Taken** — Infi TeleGroup (Telegram) |
| **P0005** | **Free** — retired Zalo bot slot, repurposed |

## Data plane

- **Canonical:** Supabase `order_desk_*` on Data Box project (`bklxcjrkhrevdcqjscku`)
- **References:** UUID `twofa_account_id` (2FA plane), string `chat_bot_id` + `chat_thread_id` (P0016)

## Screens (planned)

1. **Customers** — directory golden P0004/users
2. **Orders** — pipeline status + links
3. **Overview** — TOC + integration map

## Out of scope

- Message archive, Zalo listener, AI reply (P0016)
- Credentials / TOTP storage (P0020 vault)
- ZaloCRM pipeline, lead pool, appointments
