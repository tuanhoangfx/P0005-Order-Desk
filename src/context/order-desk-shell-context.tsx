import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type RefreshListener = () => void | Promise<void>;

type OrderDeskShellState = {
  refreshing: boolean;
  customerCount: number;
  orderCount: number;
  lastError: string | null;
  sheetSyncNote: string | null;
};

type OrderDeskShellContextValue = OrderDeskShellState & {
  refreshAll: () => Promise<void>;
  registerRefresh: (listener: RefreshListener) => () => void;
  setCustomerCount: (count: number) => void;
  setOrderCount: (count: number) => void;
  setLastError: (message: string | null) => void;
  setSheetSyncNote: (message: string | null) => void;
};

const OrderDeskShellContext = createContext<OrderDeskShellContextValue | null>(null);

export function OrderDeskShellProvider({ children }: { children: ReactNode }) {
  const listeners = useRef(new Set<RefreshListener>());
  const [refreshing, setRefreshing] = useState(false);
  const [customerCount, setCustomerCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [sheetSyncNote, setSheetSyncNote] = useState<string | null>(null);

  const registerRefresh = useCallback((listener: RefreshListener) => {
    listeners.current.add(listener);
    return () => listeners.current.delete(listener);
  }, []);

  const refreshAll = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    setLastError(null);
    try {
      await Promise.all(
        [...listeners.current].map(async (listener) => {
          await listener();
        }),
      );
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }, [refreshing]);

  const value = useMemo<OrderDeskShellContextValue>(
    () => ({
      refreshing,
      customerCount,
      orderCount,
      lastError,
      sheetSyncNote,
      refreshAll,
      registerRefresh,
      setCustomerCount,
      setOrderCount,
      setLastError,
      setSheetSyncNote,
    }),
    [refreshing, customerCount, orderCount, lastError, sheetSyncNote, refreshAll, registerRefresh],
  );

  return <OrderDeskShellContext.Provider value={value}>{children}</OrderDeskShellContext.Provider>;
}

export function useOrderDeskShell() {
  const ctx = useContext(OrderDeskShellContext);
  if (!ctx) throw new Error("useOrderDeskShell must be used within OrderDeskShellProvider");
  return ctx;
}
