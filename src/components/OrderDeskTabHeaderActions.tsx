import { useMemo } from "react";
import { HubHeaderOpsPanels } from "@tool-workspace/hub-ui";
import { useOrderDeskShell } from "../context/order-desk-shell-context";
import { useOrderDeskAuth } from "../hooks/use-order-desk-auth";
import { buildOrderDeskNotifyProps } from "../lib/order-desk-notify";
import type { AppScreen } from "../lib/screen";
import { OrderDeskDisplayPrefs } from "./OrderDeskDisplayPrefs";

type Props = {
  screen: AppScreen;
};

/** Golden header ops — Notify · Log · Settings (P0016 / hub-ui HubHeaderOpsPanels). */
export function OrderDeskTabHeaderActions({ screen }: Props) {
  const { session } = useOrderDeskAuth();
  const { refreshing, customerCount, orderCount, lastError, sheetSyncNote } = useOrderDeskShell();

  const notify = useMemo(
    () =>
      buildOrderDeskNotifyProps({
        screen,
        signedIn: Boolean(session),
        refreshing,
        customerCount,
        orderCount,
        lastError,
        sheetSyncNote,
      }),
    [screen, session, refreshing, customerCount, orderCount, lastError, sheetSyncNote],
  );

  const showTabSettings = screen === "customers" || screen === "orders";

  return (
    <HubHeaderOpsPanels
      log={{ variant: "tab", emptyMessage: "No actions logged in this session yet." }}
      notify={notify}
      trailing={showTabSettings ? <OrderDeskDisplayPrefs screen={screen} scope="tab" /> : null}
    />
  );
}
