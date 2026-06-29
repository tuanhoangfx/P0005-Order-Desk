export const TIER_FILTERS = [
  { key: "all", label: "All tiers" },
  { key: "s004", label: "S004" },
  { key: "s001", label: "S001" },
  { key: "s008", label: "S008" },
  { key: "ctv", label: "CTV" },
] as const;

export const ORDER_STATUS_FILTERS = [
  { key: "all", label: "All statuses" },
  { key: "draft", label: "Draft" },
  { key: "pending", label: "Pending" },
  { key: "paid", label: "Paid" },
  { key: "fulfilled", label: "Fulfilled" },
  { key: "cancelled", label: "Cancelled" },
] as const;
