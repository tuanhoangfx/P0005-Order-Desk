import { ClipboardList, LayoutDashboard, RefreshCcw, Users } from "lucide-react";
import { hubSessionLabels } from "@tool-workspace/hub-identity";
import {
  HubLogButton,
  HubSidebarFooterButton,
  HubSidebarNavScreenButton,
  HubSidebarShell,
  HubUiZoomControl,
  HubWorkspaceUserShell,
  resolveWorkspaceRoleKey,
  type NavIconTone,
} from "@tool-workspace/hub-ui";
import { useOrderDeskShell } from "../context/order-desk-shell-context";
import { useOrderDeskAuth } from "../hooks/use-order-desk-auth";
import { getOrderDeskSupabase, isOrderDeskSupabaseConfigured } from "../lib/supabase";
import type { AppScreen } from "../lib/screen";
import { OrderDeskDisplayPrefs } from "./OrderDeskDisplayPrefs";
import { OrderDeskImportSeedButton } from "./OrderDeskImportSeedButton";

const NAV: { screen: AppScreen; label: string; icon: typeof Users; iconTone: NavIconTone }[] = [
  { screen: "customers", label: "Customers", icon: Users, iconTone: "sky" },
  { screen: "orders", label: "Orders", icon: ClipboardList, iconTone: "emerald" },
  { screen: "overview", label: "Overview", icon: LayoutDashboard, iconTone: "amber" },
];

type Props = {
  screen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
};

export function OrderDeskSidebar({ screen, onNavigate }: Props) {
  const { session, signOut } = useOrderDeskAuth();
  const { refreshing, refreshAll } = useOrderDeskShell();
  const labels = hubSessionLabels(session);
  const roleKey = resolveWorkspaceRoleKey(session, session ? "user" : "anonymous");

  return (
    <HubSidebarShell
      brandLeading={
        <div className="brand-icon-wrap grid h-9 w-9 place-items-center rounded-[10px] text-white">
          <ClipboardList size={18} />
        </div>
      }
      brandTitle="Order Desk"
      brandTagline="P0005 · Customers & orders"
      nav={
        <>
          {NAV.map(({ screen: id, label, icon, iconTone }) => (
            <HubSidebarNavScreenButton
              key={id}
              label={label}
              icon={icon}
              iconTone={iconTone}
              active={screen === id}
              onClick={() => onNavigate(id)}
            />
          ))}
        </>
      }
      footer={
        <>
          <HubWorkspaceUserShell
            session={session}
            labels={labels}
            roleKey={roleKey}
            profileRoleClient={isOrderDeskSupabaseConfigured ? getOrderDeskSupabase() : null}
            profileRoleUserId={session?.user?.id}
            profileRoleEmail={session?.user?.email}
            footerGuestLabel="Sign in"
            emptyEmailLabel={isOrderDeskSupabaseConfigured ? "Not signed in" : "Local scaffold"}
            workspaceNote={
              isOrderDeskSupabaseConfigured
                ? "Order Desk data is scoped per signed-in user (Data Box Supabase)."
                : "Configure Supabase env to enable account sync."
            }
            onSignOut={signOut}
          />
          <HubSidebarFooterButton
            icon={RefreshCcw}
            iconClass={`text-emerald-300${refreshing ? " animate-spin" : ""}`}
            label={refreshing ? "Refreshing…" : "Refresh"}
            onClick={() => void refreshAll()}
            disabled={refreshing}
            title="Reload customers and orders from Supabase"
          />
          <OrderDeskImportSeedButton sidebarRow />
          <HubLogButton variant="global" emptyMessage="No actions logged in this session yet." />
          <OrderDeskDisplayPrefs screen={screen} sidebarRow scope="global" />
          <HubUiZoomControl />
        </>
      }
    />
  );
}
