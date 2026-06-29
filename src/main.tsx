import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  configureFilterIcons,
  configureHubChromePrefs,
  initHubUserZoom,
  mountHubApp,
} from "@tool-workspace/hub-ui";
import App from "./App";
import "./lib/url-prefs";
import "./theme/hub-globals.css";
import "./styles.css";

if (typeof window !== "undefined") {
  // Debug-only sentinel for automated verification (safe no-op in prod).
  (window as unknown as { __P0005_BOOT?: number }).__P0005_BOOT = Date.now();
  window.addEventListener("error", (e) => {
    (window as unknown as { __P0005_LAST_ERROR?: string }).__P0005_LAST_ERROR =
      (e as ErrorEvent)?.error?.message || (e as ErrorEvent)?.message || "error";
  });
  window.addEventListener("unhandledrejection", (e) => {
    const reason = (e as PromiseRejectionEvent)?.reason;
    (window as unknown as { __P0005_LAST_ERROR?: string }).__P0005_LAST_ERROR =
      reason instanceof Error ? reason.message : String(reason ?? "rejection");
  });
}

initHubUserZoom();
configureFilterIcons({ resolveAll: () => null, resolveOption: () => null });
configureHubChromePrefs(() => ({ headerPin: true, searchPin: true, stackChrome: false }));

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root not found");

mountHubApp(rootEl, () => {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
