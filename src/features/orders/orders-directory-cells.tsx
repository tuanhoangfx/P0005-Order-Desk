import {
  DirectoryTableBodyCell,
  HubActivityTimestampLabel,
  HubUsersStatusLabel,
  type HubUsersStatusTone,
} from "@tool-workspace/hub-ui";
import type { CustomerRow } from "../../lib/order-desk-types";
import type { OrderRow } from "../../lib/order-desk-types";
import type { OrderSortKey } from "./OrdersDirectoryTable";

export function orderSortableValue(row: OrderRow, key: OrderSortKey, customerById?: Map<string, CustomerRow>): string | number {
  if (key === "buyer") {
    const customer = row.customer_id ? customerById?.get(row.customer_id) : undefined;
    return (customer?.external_buyer_id ?? customer?.display_name ?? "").toLowerCase();
  }
  if (key === "amount_cents") return row.amount_cents ?? 0;
  if (key === "qty") return row.qty ?? 0;
  if (key === "updated_at") return row.updated_at ?? "";
  return String(row[key] ?? "").toLowerCase();
}

function orderStatusTone(status: string): HubUsersStatusTone {
  if (status === "paid" || status === "fulfilled") return "active";
  if (status === "pending") return "idle";
  if (status === "cancelled") return "offline";
  return "idle";
}

function buyerLabel(row: OrderRow, customerById?: Map<string, CustomerRow>): string | null {
  const customer = row.customer_id ? customerById?.get(row.customer_id) : undefined;
  return customer?.external_buyer_id || customer?.display_name || null;
}

function cellText(row: OrderRow, key: OrderSortKey, customerById?: Map<string, CustomerRow>) {
  if (key === "buyer") return buyerLabel(row, customerById) ?? "—";
  if (key === "external_order_id") return row.external_order_id ?? row.id.slice(0, 8);
  if (key === "product_name") return row.product_name ?? row.title ?? "—";
  if (key === "status") return row.status;
  if (key === "amount_cents") {
    if (row.amount_cents == null) return "—";
    return `${(row.amount_cents / 100).toLocaleString()} ${row.currency}`;
  }
  if (key === "qty") return row.qty ?? "—";
  if (key === "updated_at") return row.updated_at;
  return "—";
}

export function renderOrderDirectoryBodyCell(
  key: OrderSortKey,
  colClass: string,
  row: OrderRow,
  options?: {
    customerById?: Map<string, CustomerRow>;
    onOpenBuyer?: (row: OrderRow) => void;
  },
) {
  const customerById = options?.customerById;

  if (key === "buyer") {
    const label = buyerLabel(row, customerById);
    return (
      <DirectoryTableBodyCell key={key} colClass={colClass}>
        {label && options?.onOpenBuyer ? (
          <button
            type="button"
            className="hub-users-directory-body-text max-w-full truncate text-left text-sky-300 hover:text-sky-200"
            onClick={(e) => {
              e.stopPropagation();
              options.onOpenBuyer?.(row);
            }}
            title={`Open customer ${label}`}
          >
            {label}
          </button>
        ) : (
          <span className="hub-users-directory-body-text">{label ?? "—"}</span>
        )}
      </DirectoryTableBodyCell>
    );
  }

  if (key === "status") {
    return (
      <DirectoryTableBodyCell key={key} colClass={colClass}>
        <HubUsersStatusLabel tone={orderStatusTone(row.status)} label={row.status} />
      </DirectoryTableBodyCell>
    );
  }

  if (key === "updated_at") {
    const iso = cellText(row, key, customerById);
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

  if (key === "amount_cents" || key === "qty") {
    return (
      <DirectoryTableBodyCell key={key} colClass={colClass}>
        <span className="hub-users-directory-body-text hub-users-cell-num">{cellText(row, key, customerById)}</span>
      </DirectoryTableBodyCell>
    );
  }

  return (
    <DirectoryTableBodyCell key={key} colClass={colClass}>
      <span className="hub-users-directory-body-text">{cellText(row, key, customerById)}</span>
    </DirectoryTableBodyCell>
  );
}
