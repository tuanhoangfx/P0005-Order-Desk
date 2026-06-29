import { createDirectoryTableColumnPrefs } from "@tool-workspace/hub-ui";

export type CustomerTableColumnKey =
  | "display_name"
  | "external_buyer_id"
  | "tier"
  | "phone"
  | "seller_code"
  | "updated_at";

export const CUSTOMER_TABLE_COLUMN_ITEMS: {
  key: CustomerTableColumnKey;
  label: string;
  required?: boolean;
}[] = [
  { key: "display_name", label: "Name", required: true },
  { key: "external_buyer_id", label: "Buyer ID" },
  { key: "tier", label: "Tier" },
  { key: "phone", label: "Phone / Zalo" },
  { key: "seller_code", label: "Seller" },
  { key: "updated_at", label: "Updated" },
];

export const DEFAULT_CUSTOMER_TABLE_COLUMNS = new Set<CustomerTableColumnKey>(
  CUSTOMER_TABLE_COLUMN_ITEMS.map((c) => c.key),
);

export const CUSTOMER_TABLE_COLUMNS_CHANGE = "order-desk-customers-columns-change";

const prefs = createDirectoryTableColumnPrefs({
  storageKey: "p0005:customers-table-columns",
  items: CUSTOMER_TABLE_COLUMN_ITEMS,
  defaultKeys: DEFAULT_CUSTOMER_TABLE_COLUMNS,
  changeEvent: CUSTOMER_TABLE_COLUMNS_CHANGE,
});

export const readCustomerTableColumns = prefs.read;
export const writeCustomerTableColumns = prefs.write;
export const resetCustomerTableColumns = prefs.reset;

export function countHiddenCustomerTableColumns(): number {
  const visible = readCustomerTableColumns();
  return CUSTOMER_TABLE_COLUMN_ITEMS.filter((c) => !visible.has(c.key)).length;
}
