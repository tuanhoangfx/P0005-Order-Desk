import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? "";
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? "";

export const ORDER_DESK_SUPABASE_URL = url;
export const ORDER_DESK_SUPABASE_ANON_KEY = anonKey;
export const isOrderDeskSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getOrderDeskSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      url || "https://placeholder.supabase.co",
      anonKey || "placeholder-anon-key",
      { auth: { persistSession: true, autoRefreshToken: true } },
    );
  }
  return client;
}
