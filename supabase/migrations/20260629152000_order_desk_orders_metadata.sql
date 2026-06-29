-- P0005 Order Desk — order metadata payload (sheet bridge + cross-tool refs)

alter table public.order_desk_orders
  add column if not exists metadata jsonb not null default '{}';

