import {
  HubDisplayPrefs,
  patchHubListPrefs,
  readHubListPrefsCore,
  type HubDisplayPrefsProps,
} from "@tool-workspace/hub-ui";
import { orderDeskDisplayDefs } from "../lib/order-desk-display-registry";
import type { AppScreen } from "../lib/screen";
import { ORDER_STATUS_FILTERS, TIER_FILTERS } from "../lib/display-prefs";

type Props = {
  screen: AppScreen;
  sidebarRow?: boolean;
  scope?: HubDisplayPrefsProps["scope"];
};

export function OrderDeskDisplayPrefs({ screen, sidebarRow = false, scope = "tab" }: Props) {
  const defs = orderDeskDisplayDefs(screen);
  const filters =
    screen === "orders"
      ? ORDER_STATUS_FILTERS.map(({ key, label }) => ({ key, label }))
      : screen === "customers"
        ? TIER_FILTERS.map(({ key, label }) => ({ key, label }))
        : [];

  return (
    <HubDisplayPrefs
      title="Settings"
      scope={scope}
      sidebarRow={sidebarRow}
      showRange={screen !== "overview"}
      showLimit={false}
      showHeaderPin={scope === "global"}
      filtersFromUrl={screen !== "overview"}
      readPrefs={readHubListPrefsCore}
      patchPrefs={(patch) => patchHubListPrefs(patch)}
      getScreen={() => screen}
      getSubTab={() => ""}
      filters={filters}
      defaultFilterKeys={defs?.defaultFilterKeys ?? new Set(filters.map((f) => f.key))}
      kpis={defs?.kpis}
      charts={defs?.charts}
      headerStats={defs?.headerStats}
      defaultKpiKeys={defs?.defaultKpiKeys}
      defaultChartKeys={defs?.defaultChartKeys}
      defaultHeaderStatKeys={defs?.defaultHeaderStatKeys}
    />
  );
}
