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
import { ORDER_STATUS_FILTERS } from "../../lib/display-prefs";
import type { OrderInput } from "../../lib/order-desk-mutations";
import type { CustomerRow, OrderRow } from "../../lib/order-desk-types";

const EMPTY: OrderInput & { amount_vnd: string } = {
  status: "draft",
  product_name: "",
  external_order_id: "",
  amount_vnd: "",
  qty: 1,
  notes: "",
  currency: "VND",
};

function toForm(row: OrderRow): OrderInput & { amount_vnd: string } {
  return {
    status: row.status,
    product_name: row.product_name ?? row.title ?? "",
    external_order_id: row.external_order_id ?? "",
    amount_vnd: row.amount_cents != null ? String(row.amount_cents / 100) : "",
    qty: row.qty ?? 1,
    notes: row.notes ?? "",
    currency: row.currency,
    customer_id: row.customer_id,
  };
}

type Props = {
  open: boolean;
  mode: "add" | "edit";
  initial?: OrderRow | null;
  customers: CustomerRow[];
  onClose: () => void;
  onSave: (input: OrderInput) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function OrderRowModal({ open, mode, initial, customers, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? toForm(initial) : { ...EMPTY });
    setError(null);
    setBusy(false);
  }, [initial, open]);

  const submit = useCallback(async () => {
    if (!form.product_name?.trim() && !form.external_order_id?.trim()) {
      setError("Product name or order ID is required.");
      return;
    }
    const amountRaw = String(form.amount_vnd ?? "").replace(/[^\d.]/g, "");
    const amount = amountRaw ? Math.round(Number(amountRaw) * 100) : null;
    setBusy(true);
    setError(null);
    try {
      await onSave({
        status: form.status,
        product_name: form.product_name?.trim() || null,
        external_order_id: form.external_order_id?.trim() || null,
        amount_cents: Number.isFinite(amount ?? NaN) ? amount : null,
        currency: form.currency ?? "VND",
        qty: form.qty ?? null,
        notes: form.notes?.trim() || null,
        customer_id: form.customer_id ?? null,
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
      title={mode === "add" ? "Add order" : "Edit order"}
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
        <HubToolDetailSection id="order" title="Order">
          {error ? <p className="text-[12px] text-rose-300">{error}</p> : null}
          <HubOpsFormField label="Customer">
            <select
              className="field w-full"
              value={form.customer_id ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, customer_id: e.target.value || null }))
              }
            >
              <option value="">— None —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                  {c.external_buyer_id ? ` · ${c.external_buyer_id}` : ""}
                </option>
              ))}
            </select>
          </HubOpsFormField>
          <HubOpsFormField label="Order ID">
            <input className="field w-full" value={form.external_order_id ?? ""} onChange={(e) => setForm((p) => ({ ...p, external_order_id: e.target.value }))} placeholder="OI27xxxx" />
          </HubOpsFormField>
          <HubOpsFormField label="Product">
            <input className="field w-full" value={form.product_name ?? ""} onChange={(e) => setForm((p) => ({ ...p, product_name: e.target.value }))} />
          </HubOpsFormField>
          <HubOpsFormField label="Status">
            <select className="field w-full" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              {ORDER_STATUS_FILTERS.filter((f) => f.key !== "all").map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </HubOpsFormField>
          <HubOpsFormField label="Price (VND)">
            <input className="field w-full" value={form.amount_vnd} onChange={(e) => setForm((p) => ({ ...p, amount_vnd: e.target.value }))} />
          </HubOpsFormField>
          <HubOpsFormField label="Qty">
            <input className="field w-full" type="number" min={0} value={form.qty ?? ""} onChange={(e) => setForm((p) => ({ ...p, qty: Number(e.target.value) || null }))} />
          </HubOpsFormField>
          <HubOpsFormField label="Notes">
            <textarea className="field w-full min-h-[4rem]" value={form.notes ?? ""} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </HubOpsFormField>
        </HubToolDetailSection>
      </HubToolDetailSections>
    </HubToolDetailModal>
  );
}
