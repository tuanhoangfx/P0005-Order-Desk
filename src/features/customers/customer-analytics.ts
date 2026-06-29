import { Mail, Phone, UserRound, Users } from "lucide-react";
import type { KpiTileData, TabHeaderStatItem } from "@tool-workspace/hub-ui";
import type { CustomerRow } from "../../lib/order-desk-types";

export type CustomerKpiNumbers = {
  total: number;
  s004: number;
  s001: number;
  s008: number;
  ctv: number;
  withPhone: number;
  withEmail: number;
  recent: number;
};

function tierMatch(row: CustomerRow, code: string): boolean {
  const tier = (row.tier ?? row.seller_code ?? "").toLowerCase();
  return tier.includes(code);
}

const CUSTOMER_KPI_TILES: Array<{
  key: string;
  label: string;
  tone: KpiTileData["tone"];
  icon: KpiTileData["icon"];
  pick: (k: CustomerKpiNumbers) => number;
}> = [
  { key: "total", label: "Customers (shown)", tone: "sky", icon: Users, pick: (k) => k.total },
  { key: "s004", label: "Tier S004", tone: "indigo", icon: UserRound, pick: (k) => k.s004 },
  { key: "s001", label: "Tier S001", tone: "purple", icon: UserRound, pick: (k) => k.s001 },
  { key: "s008", label: "Tier S008", tone: "emerald", icon: UserRound, pick: (k) => k.s008 },
  { key: "ctv", label: "CTV", tone: "amber", icon: UserRound, pick: (k) => k.ctv },
  { key: "with_phone", label: "Has phone", tone: "cyan", icon: Phone, pick: (k) => k.withPhone },
  { key: "with_email", label: "Has email", tone: "violet", icon: Mail, pick: (k) => k.withEmail },
  { key: "recent", label: "Updated 7d", tone: "rose", icon: Users, pick: (k) => k.recent },
];

export function computeCustomerKpiNumbers(rows: readonly CustomerRow[]): CustomerKpiNumbers {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let s004 = 0;
  let s001 = 0;
  let s008 = 0;
  let ctv = 0;
  let withPhone = 0;
  let withEmail = 0;
  let recent = 0;
  for (const row of rows) {
    if (tierMatch(row, "s004")) s004++;
    if (tierMatch(row, "s001")) s001++;
    if (tierMatch(row, "s008")) s008++;
    if (tierMatch(row, "ctv")) ctv++;
    if (row.phone) withPhone++;
    if (row.email) withEmail++;
    if (row.updated_at && new Date(row.updated_at).getTime() >= weekAgo) recent++;
  }
  return { total: rows.length, s004, s001, s008, ctv, withPhone, withEmail, recent };
}

export function buildCustomerKpiItems(kpis: CustomerKpiNumbers): KpiTileData[] {
  return CUSTOMER_KPI_TILES.map((row) => ({
    prefKey: row.key,
    label: row.label,
    value: row.pick(kpis),
    icon: row.icon,
    tone: row.tone,
  }));
}

export function buildCustomerHeaderStats(
  visibleKeys: Set<string>,
  kpis: CustomerKpiNumbers,
  filtered: number,
): TabHeaderStatItem[] {
  const defs: Array<{
    key: string;
    icon: typeof Users;
    label: string;
    toneClass: string;
    value: number;
  }> = [
    { key: "total", icon: Users, label: "customers", toneClass: "text-sky-300", value: kpis.total },
    { key: "filtered", icon: Users, label: "filtered", toneClass: "text-indigo-300", value: filtered },
    { key: "phone", icon: Phone, label: "phone", toneClass: "text-emerald-300", value: kpis.withPhone },
    { key: "tiers", icon: UserRound, label: "tiers", toneClass: "text-amber-300", value: kpis.s004 + kpis.s001 },
  ];
  return defs
    .filter((d) => visibleKeys.has(d.key))
    .map((d) => ({ key: d.key, icon: d.icon, label: d.label, value: d.value, toneClass: d.toneClass }));
}
