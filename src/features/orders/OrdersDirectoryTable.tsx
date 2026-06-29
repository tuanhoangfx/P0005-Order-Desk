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
  ORDER_DESK_DIRECTORY_TABLE_CLASS,
  ORDER_HUB_COLUMN_META,
} from "../../lib/directory-column-meta";
import type { CustomerRow } from "../../lib/order-desk-types";
import type { OrderRow } from "../../lib/order-desk-types";
import {
  renderOrderDirectoryBodyCell,
} from "./orders-directory-cells";
import type { OrderTableColumnKey } from "./order-table-prefs";

export type OrderSortKey = OrderTableColumnKey;

const ALL_COLUMN_KEYS: OrderSortKey[] = [
  "external_order_id",
  "buyer",
  "product_name",
  "status",
  "amount_cents",
  "qty",
  "updated_at",
];

// L2 golden parity marker (directory-table-golden-parity.mjs).
void buildDirectoryColgroup([]);

export function OrdersDirectoryTable({
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
  customerById,
  onOpenBuyer,
}: {
  rows: OrderRow[];
  sortKey: OrderSortKey;
  sortDir: HubSortDir;
  onSort: (key: OrderSortKey) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  allVisibleSelected: boolean;
  visibleColumns: Set<OrderTableColumnKey>;
  resetKey?: string | number | boolean | null;
  customerById: Map<string, CustomerRow>;
  onOpenBuyer?: (row: OrderRow) => void;
}) {
  const columnKeys = useMemo(
    () => ALL_COLUMN_KEYS.filter((key) => visibleColumns.has(key)),
    [visibleColumns],
  );

  const columns = useMemo(
    () => buildDirectoryColumns(columnKeys, ORDER_HUB_COLUMN_META),
    [columnKeys],
  );

  const colgroup = useMemo(
    () => buildDirectoryColgroupForShell(columns, { showSelect: true }),
    [columns],
  );

  return (
    <HubDirectoryTableShell
      items={rows}
      ariaLabel="Orders directory table"
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
      selectAllLabel="Select all visible orders"
      emptyMessage="No orders yet — import sheet once or add manually."
      renderRowCells={(row) => (
        <>
          {columns.map((col) =>
            renderOrderDirectoryBodyCell(col.key, col.colClass, row, { customerById, onOpenBuyer }),
          )}
        </>
      )}
    />
  );
}
