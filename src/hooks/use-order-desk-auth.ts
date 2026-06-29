import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getOrderDeskSupabase, isOrderDeskSupabaseConfigured } from "../lib/supabase";

export function useOrderDeskAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!isOrderDeskSupabaseConfigured);

  useEffect(() => {
    if (!isOrderDeskSupabaseConfigured) return;
    const supabase = getOrderDeskSupabase();
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (!isOrderDeskSupabaseConfigured) return true;
    const { error } = await getOrderDeskSupabase().auth.signOut();
    return !error;
  };

  return { session, ready, signOut, configured: isOrderDeskSupabaseConfigured };
}
