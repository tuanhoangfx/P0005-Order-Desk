import type { PrefItem } from "@tool-workspace/hub-ui";
import type { AppScreen } from "./screen";
import {
  CUSTOMER_CHART_DEFS,
  CUSTOMER_HEADER_STAT_DEFS,
  CUSTOMER_KPI_DEFS,
  DEFAULT_CUSTOMER_CHART_KEYS,
  DEFAULT_CUSTOMER_HEADER_STAT_KEYS,
  DEFAULT_CUSTOMER_KPI_KEYS,
} from "../features/customers/customer-display-prefs";
import {
  DEFAULT_ORDER_CHART_KEYS,
  DEFAULT_ORDER_HEADER_STAT_KEYS,
  DEFAULT_ORDER_KPI_KEYS,
  ORDER_CHART_DEFS,
  ORDER_HEADER_STAT_DEFS,
  ORDER_KPI_DEFS,
} from "../features/orders/order-display-prefs";
import { ORDER_STATUS_FILTERS, TIER_FILTERS } from "./display-prefs";

export type OrderDeskDisplayDefs = {
  kpis: PrefItem[];
  charts: PrefItem[];
  filters: PrefItem[];
  headerStats: PrefItem[];
  defaultKpiKeys: Set<string>;
  defaultChartKeys: Set<string>;
  defaultFilterKeys: Set<string>;
  defaultHeaderStatKeys: Set<string>;
};

const ORDER_FILTER_ITEMS: PrefItem[] = ORDER_STATUS_FILTERS.filter((f) => f.key !== "all").map(
  (f) => ({ key: f.key, label: f.label }),
);

const CUSTOMER_FILTER_ITEMS: PrefItem[] = TIER_FILTERS.filter((f) => f.key !== "all").map((f) => ({
  key: f.key,
  label: f.label,
}));

const ORDERS_DEFS: OrderDeskDisplayDefs = {
  kpis: ORDER_KPI_DEFS,
  charts: ORDER_CHART_DEFS,
  filters: ORDER_FILTER_ITEMS,
  headerStats: ORDER_HEADER_STAT_DEFS,
  defaultKpiKeys: DEFAULT_ORDER_KPI_KEYS,
  defaultChartKeys: DEFAULT_ORDER_CHART_KEYS,
  defaultFilterKeys: new Set(ORDER_FILTER_ITEMS.map((f) => f.key)),
  defaultHeaderStatKeys: DEFAULT_ORDER_HEADER_STAT_KEYS,
};

const CUSTOMERS_DEFS: OrderDeskDisplayDefs = {
  kpis: CUSTOMER_KPI_DEFS,
  charts: CUSTOMER_CHART_DEFS,
  filters: CUSTOMER_FILTER_ITEMS,
  headerStats: CUSTOMER_HEADER_STAT_DEFS,
  defaultKpiKeys: DEFAULT_CUSTOMER_KPI_KEYS,
  defaultChartKeys: DEFAULT_CUSTOMER_CHART_KEYS,
  defaultFilterKeys: new Set(CUSTOMER_FILTER_ITEMS.map((f) => f.key)),
  defaultHeaderStatKeys: DEFAULT_CUSTOMER_HEADER_STAT_KEYS,
};

export function orderDeskDisplayDefs(screen: AppScreen): OrderDeskDisplayDefs | null {
  if (screen === "orders") return ORDERS_DEFS;
  if (screen === "customers") return CUSTOMERS_DEFS;
  return null;
}
