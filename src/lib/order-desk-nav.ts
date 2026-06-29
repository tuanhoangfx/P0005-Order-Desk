import type { AppScreen } from "./screen";
import { pathForScreen } from "./screen";

/** Navigate to Customers with buyer id pre-filled in search (deep link from order). */
export function navigateToCustomersBuyer(buyerKey: string) {
  const key = buyerKey.trim();
  if (!key) return;
  const sp = new URLSearchParams();
  sp.set("buyer", key);
  const path = `${pathForScreen("customers")}?${sp.toString()}`;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function readCustomersBuyerDeepLink(): string | null {
  if (typeof window === "undefined") return null;
  if (!window.location.pathname.startsWith("/customers")) return null;
  const buyer = new URLSearchParams(window.location.search).get("buyer");
  return buyer?.trim() || null;
}

export function clearCustomersBuyerDeepLink() {
  if (typeof window === "undefined") return;
  const sp = new URLSearchParams(window.location.search);
  if (!sp.has("buyer")) return;
  sp.delete("buyer");
  const qs = sp.toString();
  const path = pathForScreen("customers");
  window.history.replaceState({}, "", qs ? `${path}?${qs}` : path);
}

export function navigateToOrdersCustomer(customerId: string) {
  const id = customerId.trim();
  if (!id) return;
  const sp = new URLSearchParams();
  sp.set("customer", id);
  const path = `${pathForScreen("orders")}?${sp.toString()}`;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function readOrdersCustomerDeepLink(): string | null {
  if (typeof window === "undefined") return null;
  if (!window.location.pathname.startsWith("/orders")) return null;
  const customer = new URLSearchParams(window.location.search).get("customer");
  return customer?.trim() || null;
}

export function clearOrdersCustomerDeepLink() {
  if (typeof window === "undefined") return;
  const sp = new URLSearchParams(window.location.search);
  if (!sp.has("customer")) return;
  sp.delete("customer");
  const qs = sp.toString();
  const path = pathForScreen("orders");
  window.history.replaceState({}, "", qs ? `${path}?${qs}` : path);
}

export function navigateToScreen(screen: AppScreen) {
  const path = pathForScreen(screen);
  if (window.location.pathname === path && !window.location.search) return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
