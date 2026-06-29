export type CustomerRow = {
  id: string;
  display_name: string;
  phone: string | null;
  email: string | null;
  tags: string[];
  notes: string | null;
  external_buyer_id: string | null;
  tier: string | null;
  seller_code: string | null;
  commission_pct: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type OrderRow = {
  id: string;
  customer_id: string | null;
  status: string;
  amount_cents: number | null;
  currency: string;
  title: string | null;
  product_name: string | null;
  qty: number | null;
  notes: string | null;
  external_order_id: string | null;
  sheet_row_key: string | null;
  twofa_account_id: string | null;
  chat_bot_id: string | null;
  chat_thread_id: string | null;
  chat_channel: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
