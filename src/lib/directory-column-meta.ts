import { createDirectoryColumnMetaHelpers } from "@tool-workspace/hub-ui";

const { col, toHubDirectoryColumnMeta } = createDirectoryColumnMetaHelpers();

/** P0024 golden — every column fixed rem; CSS col/th/td locks widths (no % / auto). */
export const CUSTOMER_COLUMN_META = {
  display_name: col("Name", "hub-users-col--od-name", "name", "col.directory.account", "14rem"),
  external_buyer_id: col("Buyer ID", "hub-users-col--od-buyer-id", "code", "col.directory.uid", "8.5rem"),
  tier: col("Tier", "hub-users-col--od-tier", "category", "col.directory.category", "5.5rem"),
  phone: col("Phone / Zalo", "hub-users-col--od-phone", "email", "col.directory.phone", "9rem"),
  seller_code: col("Seller", "hub-users-col--od-seller", "role", "col.directory.chatbot", "5rem"),
  updated_at: col("Updated", "hub-users-col--od-updated", "created", "col.directory.lastActive", "6.25rem"),
} as const;

export const ORDER_COLUMN_META = {
  buyer: col("Buyer", "hub-users-col--od-buyer-id", "code", "col.directory.uid", "8.5rem"),
  external_order_id: col("Order ID", "hub-users-col--od-order-id", "code", "col.directory.uid", "8.5rem"),
  product_name: col("Product", "hub-users-col--od-product", "name", "col.directory.placeName", "18rem"),
  status: col("Status", "hub-users-col--od-status", "status", "col.directory.status", "6.5rem"),
  amount_cents: col("Price", "hub-users-col--od-amount", "version", "col.directory.clicks", "6.5rem"),
  qty: col("Qty", "hub-users-col--od-qty", "tools", "col.directory.posts", "3.75rem"),
  updated_at: col("Updated", "hub-users-col--od-updated", "created", "col.directory.lastActive", "6.25rem"),
} as const;

export const CUSTOMER_HUB_COLUMN_META = toHubDirectoryColumnMeta(CUSTOMER_COLUMN_META);
export const ORDER_HUB_COLUMN_META = toHubDirectoryColumnMeta(ORDER_COLUMN_META);

export const ORDER_DESK_DIRECTORY_TABLE_CLASS = "order-desk-directory-table";
