import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { HubBulkActionButton, HubDirectoryBulkActionRail } from "@tool-workspace/hub-ui";
import { ORDER_STATUS_FILTERS } from "../../lib/display-prefs";

type Props = {
  selectedCount: number;
  onApply: (status: string) => void;
};

export function OrderBulkStatusActions({ selectedCount, onApply }: Props) {
  const [status, setStatus] = useState("pending");

  if (selectedCount === 0) return null;

  return (
    <HubDirectoryBulkActionRail>
      <label className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
        <span className="sr-only">Bulk status</span>
        <select
          className="field min-w-[6.5rem] py-1 text-xs"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Bulk order status"
        >
          {ORDER_STATUS_FILTERS.filter((f) => f.key !== "all").map(({ key, label }) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <HubBulkActionButton
        icon={<CheckCircle2 size={14} aria-hidden />}
        label="Set status"
        title={`Set status on ${selectedCount} selected order(s)`}
        tone="emerald"
        selectedCount={selectedCount}
        onClick={() => onApply(status)}
      />
    </HubDirectoryBulkActionRail>
  );
}
