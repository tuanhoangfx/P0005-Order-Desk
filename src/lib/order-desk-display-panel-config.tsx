import { useEffect, useState } from "react";
import type { HubDirectoryDisplayPanelProps } from "@tool-workspace/hub-ui";
import { readScreenFromPath, type AppScreen } from "./screen";
import { orderDeskDisplayDefs } from "./order-desk-display-registry";
import { patchHubListPrefs, readHubListPrefs } from "./url-prefs";
import { OrderDeskDirectoryColumnsSettings } from "../components/OrderDeskDirectoryColumnsSettings";
import {
  countHiddenCustomerTableColumns,
  CUSTOMER_TABLE_COLUMN_ITEMS,
  CUSTOMER_TABLE_COLUMNS_CHANGE,
  readCustomerTableColumns,
  resetCustomerTableColumns,
  writeCustomerTableColumns,
  type CustomerTableColumnKey,
} from "../features/customers/customer-table-prefs";
import {
  countHiddenOrderTableColumns,
  ORDER_TABLE_COLUMN_ITEMS,
  ORDER_TABLE_COLUMNS_CHANGE,
  readOrderTableColumns,
  resetOrderTableColumns,
  writeOrderTableColumns,
  type OrderTableColumnKey,
} from "../features/orders/order-table-prefs";

function readScreen(): AppScreen {
  if (typeof window === "undefined") return "customers";
  return readScreenFromPath();
}

export function useOrderDeskDisplayPanelConfig(): HubDirectoryDisplayPanelProps | null {
  const [screen, setScreen] = useState<AppScreen>(() => readScreen());
  const [hiddenCols, setHiddenCols] = useState(() =>
    readScreen() === "orders" ? countHiddenOrderTableColumns() : countHiddenCustomerTableColumns(),
  );

  useEffect(() => {
    const sync = () => {
      const next = readScreen();
      setScreen(next);
      setHiddenCols(
        next === "orders" ? countHiddenOrderTableColumns() : countHiddenCustomerTableColumns(),
      );
    };
    window.addEventListener("popstate", sync);
    window.addEventListener(ORDER_TABLE_COLUMNS_CHANGE, sync);
    window.addEventListener(CUSTOMER_TABLE_COLUMNS_CHANGE, sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener(ORDER_TABLE_COLUMNS_CHANGE, sync);
      window.removeEventListener(CUSTOMER_TABLE_COLUMNS_CHANGE, sync);
    };
  }, []);

  const defs = orderDeskDisplayDefs(screen);
  if (!defs) return null;

  const isOrders = screen === "orders";

  return {
    kpis: defs.kpis,
    charts: defs.charts,
    filters: defs.filters,
    filtersFromUrl: true,
    defaultFilterKeys: defs.defaultFilterKeys,
    headerStats: defs.headerStats,
    defaultKpiKeys: defs.defaultKpiKeys,
    defaultChartKeys: defs.defaultChartKeys,
    defaultHeaderStatKeys: defs.defaultHeaderStatKeys,
    tablePanel: (
      <OrderDeskDirectoryColumnsSettings
        items={isOrders ? ORDER_TABLE_COLUMN_ITEMS : CUSTOMER_TABLE_COLUMN_ITEMS}
        readVisible={isOrders ? readOrderTableColumns : readCustomerTableColumns}
        writeVisible={(cols) =>
          isOrders
            ? writeOrderTableColumns(cols as Set<OrderTableColumnKey>)
            : writeCustomerTableColumns(cols as Set<CustomerTableColumnKey>)
        }
        changeEvent={isOrders ? ORDER_TABLE_COLUMNS_CHANGE : CUSTOMER_TABLE_COLUMNS_CHANGE}
      />
    ),
    tableSectionActions: (
      <button
        type="button"
        className="btn secondary text-xs"
        onClick={() => (isOrders ? resetOrderTableColumns() : resetCustomerTableColumns())}
      >
        Reset columns
      </button>
    ),
    tableActiveCount: hiddenCols,
    readPrefs: readHubListPrefs,
    patchPrefs: (patch) => patchHubListPrefs(patch),
    getScreen: () => readScreen(),
    getSubTab: () => "",
  };
}
