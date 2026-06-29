import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import {
  HubOpsFormField,
  HubToolDetailModal,
  HubToolDetailModalPrimaryAction,
  HubToolDetailModalSecondaryAction,
  HubToolDetailSection,
  HubToolDetailSections,
} from "@tool-workspace/hub-ui";
import type { CustomerInput } from "../../lib/order-desk-mutations";
import type { CustomerRow } from "../../lib/order-desk-types";

const EMPTY: CustomerInput = {
  display_name: "",
  phone: "",
  email: "",
  notes: "",
  external_buyer_id: "",
  tier: "",
  seller_code: "",
  commission_pct: null,
};

function toInput(row: CustomerRow): CustomerInput {
  return {
    display_name: row.display_name,
    phone: row.phone ?? "",
    email: row.email ?? "",
    notes: row.notes ?? "",
    external_buyer_id: row.external_buyer_id ?? "",
    tier: row.tier ?? "",
    seller_code: row.seller_code ?? "",
    commission_pct: row.commission_pct,
  };
}

type Props = {
  open: boolean;
  mode: "add" | "edit";
  initial?: CustomerRow | null;
  onClose: () => void;
  onSave: (input: CustomerInput) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function CustomerRowModal({ open, mode, initial, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState<CustomerInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? toInput(initial) : { ...EMPTY });
    setError(null);
    setBusy(false);
  }, [initial, open]);

  const patch = (key: keyof CustomerInput, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = useCallback(async () => {
    if (!form.display_name.trim()) {
      setError("Name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave({
        ...form,
        commission_pct: form.commission_pct
          ? Number(String(form.commission_pct).replace(/[^\d.]/g, "")) || null
          : null,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }, [form, onClose, onSave]);

  const remove = useCallback(async () => {
    if (!onDelete) return;
    setBusy(true);
    setError(null);
    try {
      await onDelete();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }, [onClose, onDelete]);

  return (
    <HubToolDetailModal
      open={open}
      onClose={onClose}
      title={mode === "add" ? "Add customer" : "Edit customer"}
      headerIcon={mode === "add" ? Plus : Pencil}
      footer={
        <>
          {mode === "edit" && onDelete ? (
            <HubToolDetailModalSecondaryAction label="Delete" disabled={busy} onClick={() => void remove()} />
          ) : null}
          <HubToolDetailModalSecondaryAction label="Cancel" disabled={busy} onClick={onClose} />
          <HubToolDetailModalPrimaryAction
            label={busy ? "Saving…" : mode === "add" ? "Create" : "Save"}
            disabled={busy}
            onClick={() => void submit()}
          />
        </>
      }
    >
      <HubToolDetailSections>
        <HubToolDetailSection id="identity" title="Identity">
          {error ? <p className="text-[12px] text-rose-300">{error}</p> : null}
          <HubOpsFormField label="Name">
            <input className="field w-full" value={form.display_name} onChange={(e) => patch("display_name", e.target.value)} />
          </HubOpsFormField>
          <HubOpsFormField label="Buyer ID">
            <input className="field w-full" value={form.external_buyer_id ?? ""} onChange={(e) => patch("external_buyer_id", e.target.value)} placeholder="CS01xxx" />
          </HubOpsFormField>
          <HubOpsFormField label="Phone / Zalo">
            <input className="field w-full" value={form.phone ?? ""} onChange={(e) => patch("phone", e.target.value)} />
          </HubOpsFormField>
          <HubOpsFormField label="Email">
            <input className="field w-full" value={form.email ?? ""} onChange={(e) => patch("email", e.target.value)} />
          </HubOpsFormField>
        </HubToolDetailSection>
        <HubToolDetailSection id="seller" title="Seller">
          <HubOpsFormField label="Tier">
            <input className="field w-full" value={form.tier ?? ""} onChange={(e) => patch("tier", e.target.value)} />
          </HubOpsFormField>
          <HubOpsFormField label="Seller code">
            <input className="field w-full" value={form.seller_code ?? ""} onChange={(e) => patch("seller_code", e.target.value)} />
          </HubOpsFormField>
          <HubOpsFormField label="Commission %">
            <input className="field w-full" value={form.commission_pct ?? ""} onChange={(e) => patch("commission_pct", e.target.value)} />
          </HubOpsFormField>
          <HubOpsFormField label="Notes">
            <textarea className="field w-full min-h-[4rem]" value={form.notes ?? ""} onChange={(e) => patch("notes", e.target.value)} />
          </HubOpsFormField>
        </HubToolDetailSection>
      </HubToolDetailSections>
    </HubToolDetailModal>
  );
}
