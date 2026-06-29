import { useCallback, useEffect, useState } from "react";
import { useOrderDeskShell } from "../../context/order-desk-shell-context";
import { fetchAllPages } from "../../lib/fetch-all-pages";
import { getOrderDeskSupabase, isOrderDeskSupabaseConfigured } from "../../lib/supabase";
import type { OrderRow } from "../../lib/order-desk-types";

const ORDER_SELECT =
  "id,customer_id,status,amount_cents,currency,title,product_name,qty,notes,external_order_id,sheet_row_key,twofa_account_id,chat_bot_id,chat_thread_id,chat_channel,metadata,created_at,updated_at";

export function useOrdersDirectory() {
  const { registerRefresh, setOrderCount, setLastError } = useOrderDeskShell();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isOrderDeskSupabaseConfigured) {
      setRows([]);
      setOrderCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLastError(null);
    const supabase = getOrderDeskSupabase();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setRows([]);
      setOrderCount(0);
      setLoading(false);
      return;
    }
    try {
      const next = await fetchAllPages<OrderRow>(async (from, to) => {
        const res = await supabase
          .from("order_desk_orders")
          .select(ORDER_SELECT)
          .order("updated_at", { ascending: false })
          .range(from, to);
        return { data: (res.data ?? []) as OrderRow[], error: res.error };
      });
      setRows(next);
      setOrderCount(next.length);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Failed to load orders");
      setRows([]);
      setOrderCount(0);
    }
    setLoading(false);
  }, [setOrderCount, setLastError]);

  useEffect(() => {
    void load();
    return registerRefresh(load);
  }, [load, registerRefresh]);

  return { rows, loading, reload: load };
}
