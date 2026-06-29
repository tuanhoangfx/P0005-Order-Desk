import type { HubNotifyPanelProps } from "@tool-workspace/hub-ui";
import type { AppScreen } from "./screen";
import { isOrderDeskSupabaseConfigured } from "./supabase";

export function buildOrderDeskNotifyProps(input: {
  screen: AppScreen;
  signedIn: boolean;
  refreshing: boolean;
  customerCount: number;
  orderCount: number;
  lastError: string | null;
  sheetSyncNote: string | null;
}): HubNotifyPanelProps {
  const alerts: HubNotifyPanelProps["alerts"] = [];

  if (!isOrderDeskSupabaseConfigured) {
    alerts.push({
      id: "supabase-missing",
      severity: "bad",
      label: "Supabase not configured",
      detail: "Set DATABOX_SUPABASE_URL + ANON_KEY in workspace .env.shared for Order Desk.",
    });
  } else if (!input.signedIn) {
    alerts.push({
      id: "auth-guest",
      severity: "warn",
      label: "Not signed in",
      detail: "Sign in via Account footer to load your customers and orders (RLS per user).",
    });
  } else {
    const scope =
      input.screen === "orders"
        ? `${input.orderCount} orders`
        : input.screen === "customers"
          ? `${input.customerCount} customers`
          : `${input.customerCount} customers · ${input.orderCount} orders`;
    alerts.push({
      id: "auth-ok",
      severity: "ok",
      label: "Workspace ready",
      detail: scope,
    });
  }

  if (input.refreshing) {
    alerts.push({
      id: "refreshing",
      severity: "warn",
      label: "Refreshing",
      detail: "Reloading directory data from Supabase…",
    });
  }

  if (input.lastError) {
    alerts.push({
      id: "last-error",
      severity: "bad",
      label: "Last action failed",
      detail: input.lastError,
    });
  }

  if (input.sheetSyncNote) {
    alerts.push({
      id: "sheet-sync",
      severity: "ok",
      label: "Sheet seed",
      detail: input.sheetSyncNote,
    });
  }

  return { alerts };
}
