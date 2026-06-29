import { HubDirectoryDisplayPanel } from "@tool-workspace/hub-ui";
import { useOrderDeskDisplayPanelConfig } from "../lib/order-desk-display-panel-config";

/** P0005 search-bar Display panel — KPI · charts · header · filters · table columns (Users golden). */
export function OrderDeskDisplayBandToolbar() {
  const config = useOrderDeskDisplayPanelConfig();
  if (!config) return null;
  return <HubDirectoryDisplayPanel {...config} />;
}
