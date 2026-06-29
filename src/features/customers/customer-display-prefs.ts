import { defaultKpiKeysFromDefs, type PrefItem } from "@tool-workspace/hub-ui";

export const CUSTOMER_KPI_DEFS: PrefItem[] = [
  { key: "total", label: "Customers (shown)" },
  { key: "s004", label: "Tier S004" },
  { key: "s001", label: "Tier S001" },
  { key: "s008", label: "Tier S008" },
  { key: "ctv", label: "CTV" },
  { key: "with_phone", label: "Has phone" },
  { key: "with_email", label: "Has email" },
  { key: "recent", label: "Updated 7d" },
];

export const DEFAULT_CUSTOMER_KPI_KEYS = defaultKpiKeysFromDefs(CUSTOMER_KPI_DEFS);

export const CUSTOMER_CHART_DEFS: PrefItem[] = [
  { key: "tier_bar", label: "By tier (bar)" },
  { key: "seller_bar", label: "By seller (bar)" },
  { key: "phone_bar", label: "Phone coverage (bar)" },
  { key: "activity_bar", label: "Recent activity (bar)" },
];

export const DEFAULT_CUSTOMER_CHART_KEYS = new Set(CUSTOMER_CHART_DEFS.map((c) => c.key));

export const CUSTOMER_HEADER_STAT_DEFS: PrefItem[] = [
  { key: "total", label: "Customers" },
  { key: "filtered", label: "Filtered" },
  { key: "phone", label: "Has phone" },
  { key: "tiers", label: "Tiers" },
];

export const DEFAULT_CUSTOMER_HEADER_STAT_KEYS = new Set(["total", "filtered", "phone"]);
