-- P0005 Order Desk — sheet bridge columns (CzP Seller Google Sheets)
alter table public.order_desk_customers
  add column if not exists external_buyer_id text,
  add column if not exists tier text,
  add column if not exists seller_code text,
  add column if not exists commission_pct numeric(5, 2);

create index if not exists order_desk_customers_external_buyer_idx
  on public.order_desk_customers (user_id, external_buyer_id)
  where external_buyer_id is not null;

alter table public.order_desk_orders
  add column if not exists external_order_id text,
  add column if not exists product_name text,
  add column if not exists qty integer,
  add column if not exists sheet_status text;

create index if not exists order_desk_orders_external_order_idx
  on public.order_desk_orders (user_id, external_order_id)
  where external_order_id is not null;

create unique index if not exists order_desk_orders_sheet_row_unique
  on public.order_desk_orders (user_id, sheet_row_key)
  where sheet_row_key is not null;
