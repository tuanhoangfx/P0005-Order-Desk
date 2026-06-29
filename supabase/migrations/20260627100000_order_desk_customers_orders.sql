-- P0005 Order Desk — customers + orders (Data Box plane bklxcjrkhrevdcqjscku)
-- Cross-tool refs only — no FK to twofa_accounts (separate Supabase project)

create table if not exists public.order_desk_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  phone text,
  email text,
  tags text[] not null default '{}',
  notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists order_desk_customers_user_idx
  on public.order_desk_customers (user_id);

create index if not exists order_desk_customers_phone_idx
  on public.order_desk_customers (user_id, phone)
  where phone is not null;

create table if not exists public.order_desk_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  customer_id uuid references public.order_desk_customers (id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'paid', 'fulfilled', 'cancelled')),
  amount_cents bigint,
  currency text not null default 'VND',
  title text,
  notes text,
  twofa_account_id uuid,
  chat_bot_id text,
  chat_thread_id text,
  chat_channel text check (chat_channel is null or chat_channel in ('zalo', 'messenger')),
  sheet_source_id uuid,
  sheet_row_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists order_desk_orders_user_idx
  on public.order_desk_orders (user_id);

create index if not exists order_desk_orders_customer_idx
  on public.order_desk_orders (customer_id);

create index if not exists order_desk_orders_status_idx
  on public.order_desk_orders (user_id, status);

create index if not exists order_desk_orders_twofa_idx
  on public.order_desk_orders (user_id, twofa_account_id)
  where twofa_account_id is not null;

create index if not exists order_desk_orders_chat_idx
  on public.order_desk_orders (user_id, chat_bot_id, chat_thread_id)
  where chat_bot_id is not null and chat_thread_id is not null;

alter table public.order_desk_customers enable row level security;
alter table public.order_desk_orders enable row level security;

create policy order_desk_customers_owner on public.order_desk_customers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy order_desk_orders_owner on public.order_desk_orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
