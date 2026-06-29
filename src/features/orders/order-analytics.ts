import {
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  Package,
  XCircle,
} from "lucide-react";
import type { KpiTileData, TabHeaderStatItem } from "@tool-workspace/hub-ui";
import type { OrderRow } from "../../lib/order-desk-types";

export type OrderKpiNumbers = {
  total: number;
  draft: number;
  pending: number;
  paid: number;
  fulfilled: number;
  cancelled: number;
  revenue: number;
  recent: number;
};

const ORDER_KPI_TILES: Array<{
  key: string;
  label: string;
  tone: KpiTileData["tone"];
  icon: KpiTileData["icon"];
  pick: (k: OrderKpiNumbers) => number | string;
}> = [
  { key: "total", label: "Orders (shown)", tone: "emerald", icon: ClipboardList, pick: (k) => k.total },
  { key: "draft", label: "Draft", tone: "amber", icon: Package, pick: (k) => k.draft },
  { key: "pending", label: "Pending", tone: "sky", icon: Clock, pick: (k) => k.pending },
  { key: "paid", label: "Paid", tone: "indigo", icon: CheckCircle2, pick: (k) => k.paid },
  { key: "fulfilled", label: "Fulfilled", tone: "emerald", icon: CheckCircle2, pick: (k) => k.fulfilled },
  { key: "cancelled", label: "Cancelled", tone: "rose", icon: XCircle, pick: (k) => k.cancelled },
  {
    key: "revenue",
    label: "Revenue (VND)",
    tone: "purple",
    icon: DollarSign,
    pick: (k) => k.revenue.toLocaleString(),
  },
  { key: "recent", label: "Updated 7d", tone: "cyan", icon: Clock, pick: (k) => k.recent },
];

export function computeOrderKpiNumbers(rows: readonly OrderRow[]): OrderKpiNumbers {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let draft = 0;
  let pending = 0;
  let paid = 0;
  let fulfilled = 0;
  let cancelled = 0;
  let revenue = 0;
  let recent = 0;
  for (const row of rows) {
    if (row.status === "draft") draft++;
    else if (row.status === "pending") pending++;
    else if (row.status === "paid") paid++;
    else if (row.status === "fulfilled") fulfilled++;
    else if (row.status === "cancelled") cancelled++;
    if (row.amount_cents) revenue += row.amount_cents;
    if (row.updated_at && new Date(row.updated_at).getTime() >= weekAgo) recent++;
  }
  return { total: rows.length, draft, pending, paid, fulfilled, cancelled, revenue, recent };
}

export function buildOrderKpiItems(kpis: OrderKpiNumbers): KpiTileData[] {
  return ORDER_KPI_TILES.map((row) => ({
    prefKey: row.key,
    label: row.label,
    value: row.pick(kpis),
    icon: row.icon,
    tone: row.tone,
  }));
}

export function buildOrderHeaderStats(
  visibleKeys: Set<string>,
  kpis: OrderKpiNumbers,
): TabHeaderStatItem[] {
  const defs: Array<{
    key: string;
    icon: typeof ClipboardList;
    label: string;
    toneClass: string;
    value: number | string;
  }> = [
    { key: "total", icon: ClipboardList, label: "orders", toneClass: "text-emerald-300", value: kpis.total },
    { key: "pending", icon: Clock, label: "pending", toneClass: "text-amber-300", value: kpis.pending },
    { key: "paid", icon: CheckCircle2, label: "paid", toneClass: "text-indigo-300", value: kpis.paid },
    {
      key: "revenue",
      icon: DollarSign,
      label: "revenue",
      toneClass: "text-purple-300",
      value: kpis.revenue.toLocaleString(),
    },
  ];
  return defs
    .filter((d) => visibleKeys.has(d.key))
    .map((d) => ({ key: d.key, icon: d.icon, label: d.label, value: d.value, toneClass: d.toneClass }));
}
