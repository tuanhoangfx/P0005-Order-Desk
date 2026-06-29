import { createDirectoryTableColumnPrefs } from "@tool-workspace/hub-ui";

export type OrderTableColumnKey =
  | "buyer"
  | "external_order_id"
  | "product_name"
  | "status"
  | "amount_cents"
  | "qty"
  | "updated_at";

export const ORDER_TABLE_COLUMN_ITEMS: { key: OrderTableColumnKey; label: string; required?: boolean }[] = [
  { key: "external_order_id", label: "Order ID", required: true },
  { key: "buyer", label: "Buyer" },
  { key: "product_name", label: "Product" },
  { key: "status", label: "Status" },
  { key: "amount_cents", label: "Price" },
  { key: "qty", label: "Qty" },
  { key: "updated_at", label: "Updated" },
];

export const DEFAULT_ORDER_TABLE_COLUMNS = new Set<OrderTableColumnKey>(
  ORDER_TABLE_COLUMN_ITEMS.map((c) => c.key),
);

export const ORDER_TABLE_COLUMNS_CHANGE = "order-desk-orders-columns-change";

const prefs = createDirectoryTableColumnPrefs({
  storageKey: "p0005:orders-table-columns",
  items: ORDER_TABLE_COLUMN_ITEMS,
  defaultKeys: DEFAULT_ORDER_TABLE_COLUMNS,
  changeEvent: ORDER_TABLE_COLUMNS_CHANGE,
});

export const readOrderTableColumns = prefs.read;
export const writeOrderTableColumns = prefs.write;
export const resetOrderTableColumns = prefs.reset;

export function countHiddenOrderTableColumns(): number {
  const visible = readOrderTableColumns();
  return ORDER_TABLE_COLUMN_ITEMS.filter((c) => !visible.has(c.key)).length;
}
