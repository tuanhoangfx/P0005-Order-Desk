export type AppScreen = "customers" | "orders" | "overview";

export function readScreenFromPath(): AppScreen {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/orders" || path.startsWith("/orders/")) return "orders";
  if (path === "/overview") return "overview";
  return "customers";
}

export function pathForScreen(screen: AppScreen): string {
  if (screen === "orders") return "/orders";
  if (screen === "overview") return "/overview";
  return "/customers";
}

export function writeScreenToUrl(screen: AppScreen) {
  const next = pathForScreen(screen);
  if (window.location.pathname !== next) {
    window.history.replaceState({}, "", next);
  }
}
