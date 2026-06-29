import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { HubAppLogProvider, resolveHubActiveScreenId, useHubActiveScreenSync } from "@tool-workspace/hub-ui";
import { OrderDeskShellProvider, useOrderDeskShell } from "./context/order-desk-shell-context";
import { OrderDeskSidebar } from "./components/OrderDeskSidebar";
import { OrderDeskAuthGate } from "./features/auth/OrderDeskAuthGate";
import { CustomersScreen } from "./features/customers/CustomersScreen";
import { OrdersScreen } from "./features/orders/OrdersScreen";
import { OverviewScreen } from "./features/overview/OverviewScreen";
import { useOrderDeskAuth } from "./hooks/use-order-desk-auth";
import { isOrderDeskSupabaseConfigured } from "./lib/supabase";
import { readScreenFromPath, writeScreenToUrl, type AppScreen } from "./lib/screen";

function OrderDeskMain({ screen }: { screen: AppScreen }) {
  const { session, ready } = useOrderDeskAuth();
  const { refreshAll } = useOrderDeskShell();
  const mainRef = useRef<HTMLElement>(null);

  const content = useMemo(() => {
    if (screen === "orders") return <OrdersScreen />;
    if (screen === "overview") return <OverviewScreen />;
    return <CustomersScreen />;
  }, [screen]);

  const needsAuthGate = isOrderDeskSupabaseConfigured && ready && !session;
  const authBootBlocking = isOrderDeskSupabaseConfigured && !ready;

  if (needsAuthGate) {
    return (
      <main
        ref={mainRef}
        className="hub-main hub-main--order-desk hub-split-scroll flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden"
      >
        <OrderDeskAuthGate onAuthed={() => void refreshAll()} />
      </main>
    );
  }

  if (authBootBlocking) {
    return (
      <main
        ref={mainRef}
        className="hub-main hub-main--order-desk flex flex-1 min-h-0 min-w-0 items-center justify-center overflow-hidden"
      >
        <div className="text-[12px] text-[var(--muted)]">Signing in…</div>
      </main>
    );
  }

  return (
    <main
      ref={mainRef}
      className="hub-main hub-main--order-desk hub-split-scroll flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden"
    >
      {content}
    </main>
  );
}

function OrderDeskApp() {
  const [screen, setScreen] = useState<AppScreen>(() => readScreenFromPath());

  useLayoutEffect(() => {
    writeScreenToUrl(screen);
  }, [screen]);

  useEffect(() => {
    const onPop = () => setScreen(readScreenFromPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useHubActiveScreenSync(screen);

  return (
    <OrderDeskShellProvider>
      <HubAppLogProvider
        activeScreen={resolveHubActiveScreenId(screen)}
        bootLog={{ scope: "P0005", message: "Order Desk started", screen }}
      >
        <div className="hub-app theme-hub flex h-full min-h-0 min-h-dvh w-full overflow-hidden">
          <OrderDeskSidebar screen={screen} onNavigate={setScreen} />
          <OrderDeskMain screen={screen} />
        </div>
      </HubAppLogProvider>
    </OrderDeskShellProvider>
  );
}

export default function App() {
  return <OrderDeskApp />;
}
