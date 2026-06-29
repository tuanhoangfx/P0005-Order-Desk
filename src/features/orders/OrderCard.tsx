import { ClipboardList, UserRound } from "lucide-react";
import {
  HubActivityTimestampLabel,
  HubDirectoryCardCheckbox,
  HubDirectoryCardHeader,
  HubDirectoryCardLeadingIcon,
  HubDirectoryInteractiveCard,
  HubUsersStatusLabel,
  type HubUsersStatusTone,
} from "@tool-workspace/hub-ui";
import type { OrderRow } from "../../lib/order-desk-types";

function orderStatusTone(status: string): HubUsersStatusTone {
  if (status === "paid" || status === "fulfilled") return "active";
  if (status === "pending") return "idle";
  if (status === "cancelled") return "offline";
  return "idle";
}

function formatPrice(row: OrderRow): string {
  if (row.amount_cents == null) return "—";
  return `${(row.amount_cents / 100).toLocaleString()} ${row.currency}`;
}

type Props = {
  row: OrderRow;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (row: OrderRow) => void;
  buyerLabel?: string | null;
  onOpenCustomer?: () => void;
};

export function OrderCard({ row, selected, onToggleSelect, onOpen, buyerLabel, onOpenCustomer }: Props) {
  const title = row.external_order_id || row.product_name || row.id.slice(0, 8);
  const subtitle = row.product_name || row.title || "—";

  return (
    <HubDirectoryInteractiveCard
      variant="panel"
      selected={selected}
      ariaLabel={`Open order ${title}`}
      onActivate={() => onOpen(row)}
    >
      <HubDirectoryCardCheckbox
        checked={selected}
        label={`Select order ${title}`}
        onChange={() => onToggleSelect(row.id)}
      />
      <HubDirectoryCardHeader
        leading={<HubDirectoryCardLeadingIcon icon={ClipboardList} tone="emerald" />}
        badges={<HubUsersStatusLabel tone={orderStatusTone(row.status)} label={row.status} />}
        title={title}
        subtitle={subtitle}
      />
      <div className="mt-4 flex flex-col gap-2 border-t border-white/5 pt-3 text-xs">
        {buyerLabel && onOpenCustomer ? (
          <button
            type="button"
            className="inline-flex max-w-full items-center gap-1.5 truncate text-left text-sky-300 hover:text-sky-200"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCustomer();
            }}
            title={`Open customer ${buyerLabel}`}
          >
            <UserRound size={12} aria-hidden />
            <span className="truncate">{buyerLabel}</span>
          </button>
        ) : null}
        <div className="flex items-center justify-between">
          <span className="tabular-nums text-[var(--text)]">{formatPrice(row)}</span>
          <span className="text-[var(--muted)]">×{row.qty ?? 1}</span>
          {row.updated_at ? <HubActivityTimestampLabel at={row.updated_at} /> : null}
        </div>
      </div>
    </HubDirectoryInteractiveCard>
  );
}
