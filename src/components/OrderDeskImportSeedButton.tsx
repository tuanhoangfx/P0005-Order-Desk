import { useState } from "react";
import { Download } from "lucide-react";
import { HubSidebarFooterButton } from "@tool-workspace/hub-ui";
import { useOrderDeskShell } from "../context/order-desk-shell-context";
import { useOrderDeskAuth } from "../hooks/use-order-desk-auth";
import { getOrderDeskSupabase, isOrderDeskSupabaseConfigured } from "../lib/supabase";
import { runSheetSeedImport } from "../lib/sheet-seed/run-sheet-seed-import";

type Props = {
  sidebarRow?: boolean;
};

/** Import legacy CzP Seller sheet rows into Order Desk (P0005 SSOT — no P0020 sheet_sources). */
export function OrderDeskImportSeedButton({ sidebarRow = false }: Props) {
  const { session } = useOrderDeskAuth();
  const { refreshing, refreshAll, setSheetSyncNote, setLastError } = useOrderDeskShell();
  const [importing, setImporting] = useState(false);

  if (!isOrderDeskSupabaseConfigured || !session?.user?.id) return null;

  const onImport = async () => {
    if (importing || refreshing) return;
    setImporting(true);
    setLastError(null);
    try {
      const supabase = getOrderDeskSupabase();
      const result = await runSheetSeedImport(supabase, session.user.id);
      setSheetSyncNote(
        `Sheet seed: ${result.buyers.upserted} buyers · ${result.orders.upserted} orders imported.`,
      );
      await refreshAll();
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Sheet import failed");
    } finally {
      setImporting(false);
    }
  };

  if (sidebarRow) {
    return (
      <HubSidebarFooterButton
        icon={Download}
        iconClass="text-sky-300"
        label={importing ? "Importing…" : "Import sheet"}
        onClick={() => void onImport()}
        disabled={importing || refreshing}
        title="One-time seed from CzP Seller Google Sheet into Order Desk"
      />
    );
  }

  return (
    <button
      type="button"
      className="hub-btn hub-btn--ghost text-[12px]"
      disabled={importing || refreshing}
      onClick={() => void onImport()}
      title="One-time seed from CzP Seller Google Sheet"
    >
      <Download size={14} aria-hidden />
      <span>{importing ? "Importing…" : "Import sheet"}</span>
    </button>
  );
}
