import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerRow, OrderRow } from "./order-desk-types";

export type CustomerInput = {
  display_name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  external_buyer_id?: string | null;
  tier?: string | null;
  seller_code?: string | null;
  commission_pct?: number | null;
};

export type OrderInput = {
  status: string;
  product_name?: string | null;
  title?: string | null;
  amount_cents?: number | null;
  currency?: string;
  qty?: number | null;
  notes?: string | null;
  external_order_id?: string | null;
  customer_id?: string | null;
};

export async function createCustomer(
  supabase: SupabaseClient,
  userId: string,
  input: CustomerInput,
): Promise<CustomerRow> {
  const { data, error } = await supabase
    .from("order_desk_customers")
    .insert({
      user_id: userId,
      display_name: input.display_name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      notes: input.notes?.trim() || null,
      external_buyer_id: input.external_buyer_id?.trim() || null,
      tier: input.tier?.trim() || null,
      seller_code: input.seller_code?.trim() || null,
      commission_pct: input.commission_pct ?? null,
      tags: [],
      metadata: {},
    })
    .select(
      "id,display_name,phone,email,tags,notes,external_buyer_id,tier,seller_code,commission_pct,metadata,created_at,updated_at",
    )
    .single();
  if (error) throw error;
  return data as CustomerRow;
}

export async function updateCustomer(
  supabase: SupabaseClient,
  id: string,
  input: CustomerInput,
): Promise<void> {
  const { error } = await supabase
    .from("order_desk_customers")
    .update({
      display_name: input.display_name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      notes: input.notes?.trim() || null,
      external_buyer_id: input.external_buyer_id?.trim() || null,
      tier: input.tier?.trim() || null,
      seller_code: input.seller_code?.trim() || null,
      commission_pct: input.commission_pct ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCustomers(supabase: SupabaseClient, ids: string[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase.from("order_desk_customers").delete().in("id", ids);
  if (error) throw error;
}

export async function createOrder(
  supabase: SupabaseClient,
  userId: string,
  input: OrderInput,
): Promise<OrderRow> {
  const product = input.product_name?.trim() || input.title?.trim() || null;
  const { data, error } = await supabase
    .from("order_desk_orders")
    .insert({
      user_id: userId,
      status: input.status,
      product_name: product,
      title: product,
      amount_cents: input.amount_cents ?? null,
      currency: input.currency ?? "VND",
      qty: input.qty ?? null,
      notes: input.notes?.trim() || null,
      external_order_id: input.external_order_id?.trim() || null,
      customer_id: input.customer_id ?? null,
      metadata: {},
    })
    .select(
      "id,customer_id,status,amount_cents,currency,title,product_name,qty,notes,external_order_id,sheet_row_key,twofa_account_id,chat_bot_id,chat_thread_id,chat_channel,metadata,created_at,updated_at",
    )
    .single();
  if (error) throw error;
  return data as OrderRow;
}

export async function updateOrder(supabase: SupabaseClient, id: string, input: OrderInput): Promise<void> {
  const product = input.product_name?.trim() || input.title?.trim() || null;
  const { error } = await supabase
    .from("order_desk_orders")
    .update({
      status: input.status,
      product_name: product,
      title: product,
      amount_cents: input.amount_cents ?? null,
      currency: input.currency ?? "VND",
      qty: input.qty ?? null,
      notes: input.notes?.trim() || null,
      external_order_id: input.external_order_id?.trim() || null,
      customer_id: input.customer_id ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function bulkUpdateOrdersStatus(
  supabase: SupabaseClient,
  ids: string[],
  status: string,
): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase
    .from("order_desk_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw error;
}

export async function deleteOrders(supabase: SupabaseClient, ids: string[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase.from("order_desk_orders").delete().in("id", ids);
  if (error) throw error;
}
