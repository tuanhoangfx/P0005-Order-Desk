import { defaultKpiKeysFromDefs, type PrefItem } from "@tool-workspace/hub-ui";

export const ORDER_KPI_DEFS: PrefItem[] = [
  { key: "total", label: "Orders (shown)" },
  { key: "draft", label: "Draft" },
  { key: "pending", label: "Pending" },
  { key: "paid", label: "Paid" },
  { key: "fulfilled", label: "Fulfilled" },
  { key: "cancelled", label: "Cancelled" },
  { key: "revenue", label: "Revenue (VND)" },
  { key: "recent", label: "Updated 7d" },
];

export const DEFAULT_ORDER_KPI_KEYS = defaultKpiKeysFromDefs(ORDER_KPI_DEFS);

export const ORDER_CHART_DEFS: PrefItem[] = [
  { key: "status_bar", label: "By status (bar)" },
  { key: "product_bar", label: "Top products (bar)" },
  { key: "currency_bar", label: "By currency (bar)" },
  { key: "qty_bar", label: "Qty distribution (bar)" },
];

export const DEFAULT_ORDER_CHART_KEYS = new Set(ORDER_CHART_DEFS.map((c) => c.key));

export const ORDER_HEADER_STAT_DEFS: PrefItem[] = [
  { key: "total", label: "Orders" },
  { key: "pending", label: "Pending" },
  { key: "paid", label: "Paid" },
  { key: "revenue", label: "Revenue" },
];

export const DEFAULT_ORDER_HEADER_STAT_KEYS = new Set(["total", "pending", "paid"]);
