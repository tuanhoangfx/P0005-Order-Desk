import { useCallback, useEffect, useState } from "react";
import { useOrderDeskShell } from "../../context/order-desk-shell-context";
import { fetchAllPages } from "../../lib/fetch-all-pages";
import { getOrderDeskSupabase, isOrderDeskSupabaseConfigured } from "../../lib/supabase";
import type { CustomerRow } from "../../lib/order-desk-types";

const CUSTOMER_SELECT =
  "id,display_name,phone,email,tags,notes,external_buyer_id,tier,seller_code,commission_pct,metadata,created_at,updated_at";

export function useCustomersDirectory() {
  const { registerRefresh, setCustomerCount, setLastError } = useOrderDeskShell();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isOrderDeskSupabaseConfigured) {
      setRows([]);
      setCustomerCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLastError(null);
    const supabase = getOrderDeskSupabase();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setRows([]);
      setCustomerCount(0);
      setLoading(false);
      return;
    }
    try {
      const next = await fetchAllPages<CustomerRow>(async (from, to) => {
        const res = await supabase
          .from("order_desk_customers")
          .select(CUSTOMER_SELECT)
          .order("updated_at", { ascending: false })
          .range(from, to);
        return { data: (res.data ?? []) as CustomerRow[], error: res.error };
      });
      setRows(next);
      setCustomerCount(next.length);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Failed to load customers");
      setRows([]);
      setCustomerCount(0);
    }
    setLoading(false);
  }, [setCustomerCount, setLastError]);

  useEffect(() => {
    void load();
    return registerRefresh(load);
  }, [load, registerRefresh]);

  return { rows, loading, reload: load };
}
