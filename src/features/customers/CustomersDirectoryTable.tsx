import { useMemo } from "react";
import {
  HubDirectoryTableShell,
  buildDirectoryColgroup,
  buildDirectoryColgroupForShell,
  buildDirectoryColumns,
  hubDirectoryTableClass,
  type HubSortDir,
} from "@tool-workspace/hub-ui";
import {
  CUSTOMER_HUB_COLUMN_META,
  ORDER_DESK_DIRECTORY_TABLE_CLASS,
} from "../../lib/directory-column-meta";
import type { CustomerRow } from "../../lib/order-desk-types";
import {
  customerSortableValue,
  renderCustomerDirectoryBodyCell,
} from "./customers-directory-cells";
import type { CustomerTableColumnKey } from "./customer-table-prefs";

export type CustomerSortKey = CustomerTableColumnKey;

const ALL_COLUMN_KEYS: CustomerSortKey[] = [
  "display_name",
  "external_buyer_id",
  "tier",
  "phone",
  "seller_code",
  "updated_at",
];

// L2 golden parity marker (directory-table-golden-parity.mjs).
void buildDirectoryColgroup([]);

export function customerSortValue(row: CustomerRow, key: CustomerSortKey): string | number {
  return customerSortableValue(row, key);
}

export function CustomersDirectoryTable({
  rows,
  sortKey,
  sortDir,
  onSort,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allVisibleSelected,
  visibleColumns,
  resetKey,
  onOpenOrders,
}: {
  rows: CustomerRow[];
  sortKey: CustomerSortKey;
  sortDir: HubSortDir;
  onSort: (key: CustomerSortKey) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  allVisibleSelected: boolean;
  visibleColumns: Set<CustomerTableColumnKey>;
  resetKey?: string | number | boolean | null;
  onOpenOrders?: (row: CustomerRow) => void;
}) {
  const columnKeys = useMemo(
    () => ALL_COLUMN_KEYS.filter((key) => visibleColumns.has(key)),
    [visibleColumns],
  );

  const columns = useMemo(
    () => buildDirectoryColumns(columnKeys, CUSTOMER_HUB_COLUMN_META),
    [columnKeys],
  );

  const colgroup = useMemo(
    () => buildDirectoryColgroupForShell(columns, { showSelect: true }),
    [columns],
  );

  return (
    <HubDirectoryTableShell
      items={rows}
      ariaLabel="Customers directory table"
      resetKey={resetKey}
      tableClassName={`${hubDirectoryTableClass("6")} ${ORDER_DESK_DIRECTORY_TABLE_CLASS}`}
      colgroup={colgroup}
      columns={columns}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      getRowKey={(row) => row.id}
      selectedIds={selectedIds}
      onToggleSelect={onToggleSelect}
      onToggleSelectAll={onToggleSelectAll}
      allVisibleSelected={allVisibleSelected}
      selectAllLabel="Select all visible customers"
      emptyMessage="No customers yet — import sheet once or add manually."
      renderRowCells={(row) => (
        <>
          {columns.map((col) =>
            renderCustomerDirectoryBodyCell(col.key, col.colClass, row, { onOpenOrders }),
          )}
        </>
      )}
    />
  );
}
