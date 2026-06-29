import { chartBreakdownFromPicker, type ChartRow } from "@tool-workspace/hub-ui";
import type { OrderRow } from "../../lib/order-desk-types";

export type OrderChartBands = {
  status_bar: ChartRow[];
  product_bar: ChartRow[];
  currency_bar: ChartRow[];
  qty_bar: ChartRow[];
};

function qtyBucket(qty: number | null | undefined): string {
  const n = qty ?? 0;
  if (n <= 1) return "1";
  if (n <= 3) return "2–3";
  return "4+";
}

export function orderCharts(rows: readonly OrderRow[]): OrderChartBands {
  return {
    status_bar: chartBreakdownFromPicker(rows, (row) => row.status || "unknown"),
    product_bar: chartBreakdownFromPicker(rows, (row) => row.product_name || row.title || "—"),
    currency_bar: chartBreakdownFromPicker(rows, (row) => row.currency || "—"),
    qty_bar: chartBreakdownFromPicker(rows, (row) => qtyBucket(row.qty)),
  };
}
