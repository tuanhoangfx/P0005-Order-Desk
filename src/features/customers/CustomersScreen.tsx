/* table-only-directory no-read-only-table no-form-directory */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Database, Users } from "lucide-react";
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
import { TIER_FILTERS } from "../../lib/display-prefs";
import { readCustomersBuyerDeepLink, navigateToOrdersCustomer } from "../../lib/order-desk-nav";
import {
  createCustomer,
  deleteCustomers,
  updateCustomer,
  type CustomerInput,
} from "../../lib/order-desk-mutations";
import { getOrderDeskSupabase, isOrderDeskSupabaseConfigured } from "../../lib/supabase";
import { useHubListPrefs } from "../../lib/url-prefs";
import type { CustomerRow } from "../../lib/order-desk-types";
import { CustomerCard } from "./CustomerCard";
import { CustomerRowModal } from "./CustomerRowModal";
import {
  CustomersDirectoryTable,
  customerSortValue,
  type CustomerSortKey,
} from "./CustomersDirectoryTable";
import { useCustomersDirectory } from "./use-customers";
import { customerCharts } from "./customer-chart-aggregates";
import {
  buildCustomerHeaderStats,
  buildCustomerKpiItems,
  computeCustomerKpiNumbers,
} from "./customer-analytics";
import {
  CUSTOMER_CHART_DEFS,
  DEFAULT_CUSTOMER_CHART_KEYS,
  DEFAULT_CUSTOMER_HEADER_STAT_KEYS,
  DEFAULT_CUSTOMER_KPI_KEYS,
} from "./customer-display-prefs";
import {
  CUSTOMER_TABLE_COLUMNS_CHANGE,
  readCustomerTableColumns,
  type CustomerTableColumnKey,
} from "./customer-table-prefs";

export function CustomersScreen() {
  const { session } = useOrderDeskAuth();
  const { rows, reload } = useCustomersDirectory();
  const hubPrefs = useHubListPrefs();
  const timeRange = useDirectoryTimeRange();
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [viewMode, setViewMode] = useState<HubViewMode>("table");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [visibleColumns, setVisibleColumns] = useState(() => readCustomerTableColumns());

  useEffect(() => {
    const sync = () => setVisibleColumns(readCustomerTableColumns());
    window.addEventListener(CUSTOMER_TABLE_COLUMNS_CHANGE, sync);
    return () => window.removeEventListener(CUSTOMER_TABLE_COLUMNS_CHANGE, sync);
  }, []);

  useEffect(() => {
    const syncBuyer = () => {
      const buyer = readCustomersBuyerDeepLink();
      if (buyer) setQuery(buyer);
    };
    syncBuyer();
    window.addEventListener("popstate", syncBuyer);
    return () => window.removeEventListener("popstate", syncBuyer);
  }, []);

  const filterDefs = useMemo<FilterDef[]>(
    () => [
      {
        key: "tier",
        label: "Tier",
        options: TIER_FILTERS.map(({ key, label }) => ({ value: key, label })),
      },
    ],
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (!matchesDirectoryTimeRange(row.updated_at, timeRange)) return false;
      if (q) {
        const hay = [row.display_name, row.external_buyer_id, row.phone, row.email, row.seller_code]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const tierKey = String(filterValues.tier ?? "all");
      if (tierKey !== "all") {
        const tier = (row.tier ?? row.seller_code ?? "").toLowerCase();
        if (!tier.includes(tierKey)) return false;
      }
      return true;
    });
  }, [rows, query, filterValues, timeRange]);

  const { sortKey, sortDir, onSort, sorted } = useDirectoryTableSort<CustomerSortKey, CustomerRow>(
    filtered,
    "display_name",
    customerSortValue,
    "asc",
  );

  const listResetKey = useMemo(
    () => hubDirectoryListResetKey({ query, filters: filterValues, sortKey, sortDir, viewMode }),
    [filterValues, query, sortDir, sortKey, viewMode],
  );

  const selection = useHubDirectorySelection(sorted, (row) => row.id);

  const stats = useMemo(() => computeCustomerKpiNumbers(filtered), [filtered]);

  const visKpi = useMemo(
    () => coalescePrefSet(hubPrefs.kpi, DEFAULT_CUSTOMER_KPI_KEYS),
    [hubPrefs.kpi],
  );
  const visCharts = useMemo(
    () => resolveVisibleChartKeys(hubPrefs.charts, DEFAULT_CUSTOMER_CHART_KEYS, CUSTOMER_CHART_DEFS),
    [hubPrefs.charts],
  );
  const visHeaderStats = useMemo(
    () => coalescePrefSet(hubPrefs.headerStats, DEFAULT_CUSTOMER_HEADER_STAT_KEYS),
    [hubPrefs.headerStats],
  );

  const kpis = useMemo(
    () => buildCustomerKpiItems(stats).filter((item) => !item.prefKey || visKpi.has(item.prefKey)),
    [stats, visKpi],
  );

  const charts = useMemo(() => customerCharts(filtered), [filtered]);

  const chartsBand = directoryChartBandNode({
    visCharts,
    defs: CUSTOMER_CHART_DEFS,
    data: {
      tier_bar: charts.tier_bar,
      seller_bar: charts.seller_bar,
      phone_bar: charts.phone_bar,
      activity_bar: charts.activity_bar,
    },
  });

  const centerStats = useMemo(
    () => buildCustomerHeaderStats(visHeaderStats, stats, sorted.length),
    [visHeaderStats, stats, sorted.length],
  );

  const openAdd = useCallback(() => {
    setModalMode("add");
    setEditing(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback(
    (row?: CustomerRow) => {
      const target = row ?? rows.find((r) => r.id === [...selection.selectedIds][0]);
      if (!target) return;
      setModalMode("edit");
      setEditing(target);
      setModalOpen(true);
    },
    [rows, selection.selectedIds],
  );

  const saveCustomer = useCallback(
    async (input: CustomerInput) => {
      const supabase = getOrderDeskSupabase();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Sign in required.");
      if (modalMode === "add") {
        await createCustomer(supabase, userId, input);
      } else if (editing) {
        await updateCustomer(supabase, editing.id, input);
      }
      await reload();
    },
    [editing, modalMode, reload, session?.user?.id],
  );

  const deleteSelected = useCallback(async () => {
    const ids = [...selection.selectedIds];
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} customer(s)? Orders keep customer_id unset.`)) return;
    await deleteCustomers(getOrderDeskSupabase(), ids);
    selection.setSelectedIds(new Set());
    await reload();
  }, [reload, selection]);

  const openOrdersForCustomer = useCallback((row: CustomerRow) => {
    navigateToOrdersCustomer(row.id);
  }, []);

  const headerActions = <OrderDeskTabHeaderActions screen="customers" />;

  const header = (
    <OrderDeskDirectoryTabHeader
      ariaLabel="Customers header"
      titleIcon={Users}
      titleIconClass="text-sky-300"
      title="Customers"
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
        sectionRuleLabel="Customers"
        filters={filterDefs}
        query={query}
        onQueryChange={setQuery}
        filterValues={filterValues}
        onFilterValuesChange={setFilterValues}
        filterPlaceholder="Search buyer name, CS id, phone…"
        filterShortcutScope="customers"
        directoryViewMode={viewMode}
        filterSelectionToolbar={{
          visibleCount: sorted.length,
          selectedCount: selection.selectedIds.size,
          noun: "customers",
        }}
        filterToolbar={
          <DirectorySearchToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            countIcon={Users}
            shown={sorted.length}
            total={rows.length}
            countLabel="customers"
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
                    noun: "customers",
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
              primaryLabel="Add customer"
            />
          </HubDirectoryBulkActionBar>
        }
      >
        <div className="relative min-h-[200px]">
          {viewMode === "card" ? (
            <HubPaginatedCardGrid items={sorted} resetKey={listResetKey} ariaLabel="Customers card pages">
              {(pageRows) =>
                pageRows.map((row) => (
                  <CustomerCard
                    key={row.id}
                    row={row}
                    selected={selection.selectedIds.has(row.id)}
                    onToggleSelect={selection.toggleSelect}
                    onOpen={(r) => openEdit(r)}
                    onOpenOrders={openOrdersForCustomer}
                  />
                ))
              }
            </HubPaginatedCardGrid>
          ) : (
            <CustomersDirectoryTable
              rows={sorted}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              selectedIds={selection.selectedIds}
              onToggleSelect={selection.toggleSelect}
              onToggleSelectAll={selection.toggleSelectAll}
              allVisibleSelected={selection.allVisibleSelected}
              visibleColumns={visibleColumns as Set<CustomerTableColumnKey>}
              resetKey={listResetKey}
              onOpenOrders={openOrdersForCustomer}
            />
          )}
        </div>
      </HubDirectoryScreen>

      <CustomerRowModal
        open={modalOpen}
        mode={modalMode}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSave={saveCustomer}
        onDelete={
          modalMode === "edit" && editing
            ? async () => {
                await deleteCustomers(getOrderDeskSupabase(), [editing.id]);
                selection.setSelectedIds(new Set());
                await reload();
              }
            : undefined
        }
      />

      {!isOrderDeskSupabaseConfigured ? (
        <p className="sr-only">Supabase not configured</p>
      ) : null}
    </>
  );
}
