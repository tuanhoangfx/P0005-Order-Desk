import { chartBreakdownFromPicker, type ChartRow } from "@tool-workspace/hub-ui";
import type { CustomerRow } from "../../lib/order-desk-types";

export type CustomerChartBands = {
  tier_bar: ChartRow[];
  seller_bar: ChartRow[];
  phone_bar: ChartRow[];
  activity_bar: ChartRow[];
};

export function customerCharts(rows: readonly CustomerRow[]): CustomerChartBands {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return {
    tier_bar: chartBreakdownFromPicker(rows, (row) => row.tier || row.seller_code || "—"),
    seller_bar: chartBreakdownFromPicker(rows, (row) => row.seller_code || "—"),
    phone_bar: chartBreakdownFromPicker(rows, (row) => (row.phone ? "Has phone" : "No phone")),
    activity_bar: chartBreakdownFromPicker(rows, (row) =>
      row.updated_at && new Date(row.updated_at).getTime() >= weekAgo ? "Updated 7d" : "Older",
    ),
  };
}
