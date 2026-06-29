import {
  DirectoryTableBodyCell,
  HubActivityTimestampLabel,
} from "@tool-workspace/hub-ui";
import type { CustomerRow } from "../../lib/order-desk-types";
import type { CustomerSortKey } from "./CustomersDirectoryTable";

export function customerSortableValue(row: CustomerRow, key: CustomerSortKey): string | number {
  if (key === "updated_at") return row.updated_at ?? "";
  return String(row[key] ?? "").toLowerCase();
}

function cellText(row: CustomerRow, key: CustomerSortKey) {
  if (key === "display_name") return row.display_name;
  if (key === "external_buyer_id") return row.external_buyer_id ?? "—";
  if (key === "tier") return row.tier ?? "—";
  if (key === "phone") return row.phone ?? "—";
  if (key === "seller_code") return row.seller_code ?? "—";
  if (key === "updated_at") return row.updated_at;
  return "—";
}

export function renderCustomerDirectoryBodyCell(
  key: CustomerSortKey,
  colClass: string,
  row: CustomerRow,
  options?: {
    onOpenOrders?: (row: CustomerRow) => void;
  },
) {
  if (key === "display_name" || key === "external_buyer_id") {
    const label = cellText(row, key);
    const canLink = key === "external_buyer_id" && label !== "—" && options?.onOpenOrders;
    return (
      <DirectoryTableBodyCell key={key} colClass={colClass}>
        {canLink ? (
          <button
            type="button"
            className="hub-users-directory-body-text max-w-full truncate text-left text-emerald-300 hover:text-emerald-200"
            onClick={(e) => {
              e.stopPropagation();
              options.onOpenOrders?.(row);
            }}
            title={`View orders for ${label}`}
          >
            {label}
          </button>
        ) : key === "display_name" && options?.onOpenOrders ? (
          <button
            type="button"
            className="hub-users-directory-body-text max-w-full truncate text-left hover:text-sky-200"
            onClick={(e) => {
              e.stopPropagation();
              options.onOpenOrders?.(row);
            }}
            title={`View orders for ${label}`}
          >
            {label}
          </button>
        ) : (
          <span className="hub-users-directory-body-text">{label}</span>
        )}
      </DirectoryTableBodyCell>
    );
  }

  if (key === "updated_at") {
    const iso = cellText(row, key);
    return (
      <DirectoryTableBodyCell key={key} colClass={colClass}>
        {iso && iso !== "—" ? (
          <HubActivityTimestampLabel at={String(iso)} />
        ) : (
          <span className="hub-users-directory-body-text hub-users-cell-muted">—</span>
        )}
      </DirectoryTableBodyCell>
    );
  }

  return (
    <DirectoryTableBodyCell key={key} colClass={colClass}>
      <span className="hub-users-directory-body-text">{cellText(row, key)}</span>
    </DirectoryTableBodyCell>
  );
}
