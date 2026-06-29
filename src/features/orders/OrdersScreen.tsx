/* table-only-directory no-read-only-table no-form-directory */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import {
  DirectorySearchToolbar,
  HubDirectoryBulkActionBar,
  HubDirectoryScreen,
  HubPaginatedCardGrid,
  directoryChartBandNode,
  hubDirectoryListResetKey,
  matchesDirectoryTimeRange,
  resolveVisibleChartKeys,
  useDirectoryTableSort,
  useDirectoryTimeRange,
  useHubDirectorySelection,
  type FilterDef,
  type FilterValues,
  type HubViewMode,
} from "@tool-workspace/hub-ui";
import { OrderDeskDirectoryBulkBar } from "../../components/OrderDeskDirectoryBulkBar";
import { OrderDeskDirectoryTabHeader } from "../../components/OrderDeskDirectoryTabHeader";
import { OrderDeskDisplayBandToolbar } from "../../components/OrderDeskDisplayBandToolbar";
import { OrderDeskTabHeaderActions } from "../../components/OrderDeskTabHeaderActions";
import { useOrderDeskAuth } from "../../hooks/use-order-desk-auth";
import { coalescePrefSet } from "../../lib/coalesce-pref-set";
import { ORDER_STATUS_FILTERS } from "../../lib/display-prefs";
import {
  createOrder,
  bulkUpdateOrdersStatus,
  deleteOrders,
  updateOrder,
  type OrderInput,
} from "../../lib/order-desk-mutations";
import { navigateToCustomersBuyer, readOrdersCustomerDeepLink } from "../../lib/order-desk-nav";
import { getOrderDeskSupabase } from "../../lib/supabase";
import { useHubListPrefs } from "../../lib/url-prefs";
import type { OrderRow } from "../../lib/order-desk-types";
import { useCustomersDirectory } from "../customers/use-customers";
import { OrderBulkStatusActions } from "./OrderBulkStatusActions";
import { OrderCard } from "./OrderCard";
import { OrderRowModal } from "./OrderRowModal";
import { OrdersDirectoryTable, type OrderSortKey } from "./OrdersDirectoryTable";
import { orderSortableValue } from "./orders-directory-cells";
import { useOrdersDirectory } from "./use-orders";
import { orderCharts } from "./order-chart-aggregates";
import {
  buildOrderHeaderStats,
  buildOrderKpiItems,
  computeOrderKpiNumbers,
} from "./order-analytics";
import {
  DEFAULT_ORDER_CHART_KEYS,
  DEFAULT_ORDER_HEADER_STAT_KEYS,
  DEFAULT_ORDER_KPI_KEYS,
  ORDER_CHART_DEFS,
} from "./order-display-prefs";
import {
  ORDER_TABLE_COLUMNS_CHANGE,
  readOrderTableColumns,
  type OrderTableColumnKey,
} from "./order-table-prefs";

export function OrdersScreen() {
  const { session } = useOrderDeskAuth();
  const { rows, reload } = useOrdersDirectory();
  const { rows: customers } = useCustomersDirectory();
  const customerById = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const hubPrefs = useHubListPrefs();
  const timeRange = useDirectoryTimeRange();
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [viewMode, setViewMode] = useState<HubViewMode>("table");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editing, setEditing] = useState<OrderRow | null>(null);
  const [customerFilterId, setCustomerFilterId] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState(() => readOrderTableColumns());

  useEffect(() => {
    const sync = () => setVisibleColumns(readOrderTableColumns());
    window.addEventListener(ORDER_TABLE_COLUMNS_CHANGE, sync);
    return () => window.removeEventListener(ORDER_TABLE_COLUMNS_CHANGE, sync);
  }, []);

  useEffect(() => {
    const syncCustomer = () => {
      const customerId = readOrdersCustomerDeepLink();
      if (customerId) {
        setCustomerFilterId(customerId);
        const customer = customers.find((c) => c.id === customerId);
        if (customer) {
          const label = customer.external_buyer_id || customer.display_name;
          if (label) setQuery(label);
        }
      }
    };
    syncCustomer();
    window.addEventListener("popstate", syncCustomer);
    return () => window.removeEventListener("popstate", syncCustomer);
  }, [customers]);

  const filterDefs = useMemo<FilterDef[]>(
    () => [
      {
        key: "status",
        label: "Status",
        options: ORDER_STATUS_FILTERS.map(({ key, label }) => ({ value: key, label })),
      },
    ],
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (!matchesDirectoryTimeRange(row.updated_at, timeRange)) return false;
      if (customerFilterId && row.customer_id !== customerFilterId) return false;
      if (q) {
        const customer = row.customer_id ? customerById.get(row.customer_id) : undefined;
        const hay = [
          row.external_order_id,
          row.product_name,
          row.title,
          row.status,
          customer?.display_name,
          customer?.external_buyer_id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const statusKey = String(filterValues.status ?? "all");
      if (statusKey !== "all" && row.status !== statusKey) return false;
      return true;
    });
  }, [rows, query, filterValues, timeRange, customerById, customerFilterId]);

  const orderSortValue = useCallback(
    (row: OrderRow, key: OrderSortKey) => orderSortableValue(row, key, customerById),
    [customerById],
  );

  const { sortKey, sortDir, onSort, sorted } = useDirectoryTableSort<OrderSortKey, OrderRow>(
    filtered,
    "updated_at",
    orderSortValue,
    "desc",
  );

  const listResetKey = useMemo(
    () => hubDirectoryListResetKey({ query, filters: filterValues, sortKey, sortDir, viewMode }),
    [filterValues, query, sortDir, sortKey, viewMode],
  );

  const selection = useHubDirectorySelection(sorted, (row) => row.id);

  const stats = useMemo(() => computeOrderKpiNumbers(filtered), [filtered]);

  const visKpi = useMemo(
    () => coalescePrefSet(hubPrefs.kpi, DEFAULT_ORDER_KPI_KEYS),
    [hubPrefs.kpi],
  );
  const visCharts = useMemo(
    () => resolveVisibleChartKeys(hubPrefs.charts, DEFAULT_ORDER_CHART_KEYS, ORDER_CHART_DEFS),
    [hubPrefs.charts],
  );
  const visHeaderStats = useMemo(
    () => coalescePrefSet(hubPrefs.headerStats, DEFAULT_ORDER_HEADER_STAT_KEYS),
    [hubPrefs.headerStats],
  );

  const kpis = useMemo(
    () => buildOrderKpiItems(stats).filter((item) => !item.prefKey || visKpi.has(item.prefKey)),
    [stats, visKpi],
  );

  const charts = useMemo(() => orderCharts(filtered), [filtered]);

  const chartsBand = directoryChartBandNode({
    visCharts,
    defs: ORDER_CHART_DEFS,
    data: {
      status_bar: charts.status_bar,
      product_bar: charts.product_bar,
      currency_bar: charts.currency_bar,
      qty_bar: charts.qty_bar,
    },
  });

  const centerStats = useMemo(
    () => buildOrderHeaderStats(visHeaderStats, stats),
    [visHeaderStats, stats],
  );

  const openAdd = useCallback(() => {
    setModalMode("add");
    setEditing(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback(
    (row?: OrderRow) => {
      const target = row ?? rows.find((r) => r.id === [...selection.selectedIds][0]);
      if (!target) return;
      setModalMode("edit");
      setEditing(target);
      setModalOpen(true);
    },
    [rows, selection.selectedIds],
  );

  const saveOrder = useCallback(
    async (input: OrderInput) => {
      const supabase = getOrderDeskSupabase();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Sign in required.");
      if (modalMode === "add") {
        await createOrder(supabase, userId, input);
      } else if (editing) {
        await updateOrder(supabase, editing.id, input);
      }
      await reload();
    },
    [editing, modalMode, reload, session?.user?.id],
  );

  const deleteSelected = useCallback(async () => {
    const ids = [...selection.selectedIds];
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} order(s)?`)) return;
    await deleteOrders(getOrderDeskSupabase(), ids);
    selection.setSelectedIds(new Set());
    await reload();
  }, [reload, selection]);

  const bulkSetStatus = useCallback(
    async (status: string) => {
      const ids = [...selection.selectedIds];
      if (!ids.length) return;
      await bulkUpdateOrdersStatus(getOrderDeskSupabase(), ids, status);
      selection.setSelectedIds(new Set());
      await reload();
    },
    [reload, selection],
  );

  const openCustomerForOrder = useCallback(
    (row: OrderRow) => {
      const customer = row.customer_id ? customerById.get(row.customer_id) : undefined;
      const key = customer?.external_buyer_id || customer?.display_name;
      if (!key) return;
      navigateToCustomersBuyer(key);
    },
    [customerById],
  );

  const headerActions = <OrderDeskTabHeaderActions screen="orders" />;

  const header = (
    <OrderDeskDirectoryTabHeader
      ariaLabel="Orders header"
      titleIcon={ClipboardList}
      titleIconClass="text-emerald-300"
      title="Orders"
      centerStats={centerStats}
      actions={headerActions}
    />
  );

  return (
    <>
      <HubDirectoryScreen
        header={header}
        kpis={kpis.length > 0 ? kpis : undefined}
        charts={chartsBand}
        sectionRuleLabel="Orders"
        filters={filterDefs}
        query={query}
        onQueryChange={setQuery}
        filterValues={filterValues}
        onFilterValuesChange={setFilterValues}
        filterPlaceholder="Search order id, product, status…"
        filterShortcutScope="orders"
        directoryViewMode={viewMode}
        filterSelectionToolbar={{
          visibleCount: sorted.length,
          selectedCount: selection.selectedIds.size,
          noun: "orders",
        }}
        filterToolbar={
          <DirectorySearchToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            countIcon={ClipboardList}
            shown={sorted.length}
            total={rows.length}
            countLabel="orders"
            showRefresh={false}
            showResultCount={viewMode === "card"}
            displayBand={<OrderDeskDisplayBandToolbar />}
          />
        }
        filterRowActions={
          <HubDirectoryBulkActionBar
            selectAll={
              viewMode === "card"
                ? {
                    visibleCount: sorted.length,
                    selectedCount: selection.selectedIds.size,
                    allVisibleSelected: selection.allVisibleSelected,
                    onToggleSelectAll: selection.toggleSelectAll,
                    noun: "orders",
                  }
                : null
            }
          >
            <OrderDeskDirectoryBulkBar
              hasSelection={selection.selectedIds.size > 0}
              selectedCount={selection.selectedIds.size}
              onAdd={openAdd}
              onEdit={() => openEdit()}
              onDelete={() => void deleteSelected()}
              primaryLabel="Add order"
            />
            <OrderBulkStatusActions
              selectedCount={selection.selectedIds.size}
              onApply={(status) => void bulkSetStatus(status)}
            />
          </HubDirectoryBulkActionBar>
        }
      >
        <div className="relative min-h-[200px]">
          {viewMode === "card" ? (
            <HubPaginatedCardGrid items={sorted} resetKey={listResetKey} ariaLabel="Orders card pages">
              {(pageRows) =>
                pageRows.map((row) => {
                  const customer = row.customer_id ? customerById.get(row.customer_id) : undefined;
                  const buyerLabel =
                    customer?.external_buyer_id || customer?.display_name || null;
                  return (
                    <OrderCard
                      key={row.id}
                      row={row}
                      selected={selection.selectedIds.has(row.id)}
                      onToggleSelect={selection.toggleSelect}
                      onOpen={(r) => openEdit(r)}
                      buyerLabel={buyerLabel}
                      onOpenCustomer={buyerLabel ? () => openCustomerForOrder(row) : undefined}
                    />
                  );
                })
              }
            </HubPaginatedCardGrid>
          ) : (
            <OrdersDirectoryTable
              rows={sorted}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              selectedIds={selection.selectedIds}
              onToggleSelect={selection.toggleSelect}
              onToggleSelectAll={selection.toggleSelectAll}
              allVisibleSelected={selection.allVisibleSelected}
              visibleColumns={visibleColumns as Set<OrderTableColumnKey>}
              resetKey={listResetKey}
              customerById={customerById}
              onOpenBuyer={openCustomerForOrder}
            />
          )}
        </div>
      </HubDirectoryScreen>

      <OrderRowModal
        open={modalOpen}
        mode={modalMode}
        initial={editing}
        customers={customers}
        onClose={() => setModalOpen(false)}
        onSave={saveOrder}
        onDelete={
          modalMode === "edit" && editing
            ? async () => {
                await deleteOrders(getOrderDeskSupabase(), [editing.id]);
                selection.setSelectedIds(new Set());
                await reload();
              }
            : undefined
        }
      />
    </>
  );
}
