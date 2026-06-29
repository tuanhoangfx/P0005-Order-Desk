import { ClipboardList, Users } from "lucide-react";
import {
  HubActivityTimestampLabel,
  HubDirectoryCardCheckbox,
  HubDirectoryCardHeader,
  HubDirectoryCardLeadingIcon,
  HubDirectoryInteractiveCard,
} from "@tool-workspace/hub-ui";
import type { CustomerRow } from "../../lib/order-desk-types";

type Props = {
  row: CustomerRow;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (row: CustomerRow) => void;
  onOpenOrders?: (row: CustomerRow) => void;
};

export function CustomerCard({ row, selected, onToggleSelect, onOpen, onOpenOrders }: Props) {
  const subtitle = [row.external_buyer_id, row.phone, row.tier].filter(Boolean).join(" · ") || "—";

  return (
    <HubDirectoryInteractiveCard
      variant="panel"
      selected={selected}
      ariaLabel={`Open customer ${row.display_name}`}
      onActivate={() => onOpen(row)}
    >
      <HubDirectoryCardCheckbox
        checked={selected}
        label={`Select ${row.display_name}`}
        onChange={() => onToggleSelect(row.id)}
      />
      <HubDirectoryCardHeader
        leading={<HubDirectoryCardLeadingIcon icon={Users} tone="sky" />}
        title={row.display_name}
        subtitle={subtitle}
      />
      <div className="mt-4 flex flex-col gap-2 border-t border-white/5 pt-3 text-xs">
        {onOpenOrders ? (
          <button
            type="button"
            className="inline-flex max-w-full items-center gap-1.5 truncate text-left text-emerald-300 hover:text-emerald-200"
            onClick={(e) => {
              e.stopPropagation();
              onOpenOrders(row);
            }}
            title={`View orders for ${row.display_name}`}
          >
            <ClipboardList size={12} aria-hidden />
            <span className="truncate">Orders</span>
          </button>
        ) : null}
        <div className="flex items-center justify-between text-[var(--muted)]">
          <span>{row.seller_code || "—"}</span>
          {row.updated_at ? <HubActivityTimestampLabel at={row.updated_at} /> : null}
        </div>
      </div>
    </HubDirectoryInteractiveCard>
  );
}
