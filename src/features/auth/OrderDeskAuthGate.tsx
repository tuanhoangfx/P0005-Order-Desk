import { ClipboardList } from "lucide-react";
import { WorkspaceAuthGate, createWorkspaceAuthGate } from "@tool-workspace/hub-ui";
import { getOrderDeskSupabase, isOrderDeskSupabaseConfigured } from "../../lib/supabase";
import { orderDeskForgotPasswordHandlers, signInOrderDesk } from "../../lib/order-desk-sign-in";

type Props = {
  onAuthed?: () => void;
};

/** Order Desk sign-in gate — Data Box Supabase (P0005 SSOT, no P0020 sheet_sources). */
export function OrderDeskAuthGate({ onAuthed }: Props) {
  if (!isOrderDeskSupabaseConfigured) return null;
  const supabase = getOrderDeskSupabase();

  return (
    <WorkspaceAuthGate
      {...createWorkspaceAuthGate({
        code: "P0005",
        toolName: "Order Desk",
        tagline: "Customers & orders",
        headerLeading: (
          <div className="brand-icon-wrap grid h-9 w-9 place-items-center rounded-[10px] text-white">
            <ClipboardList size={18} />
          </div>
        ),
        onAuthed,
        profileRoleClient: supabase,
        onSubmit: async (login, password, mode) => {
          const result = await signInOrderDesk(login, password, mode);
          if (result.error) return { error: result.error };
        },
        forgotPassword: orderDeskForgotPasswordHandlers(supabase),
      })}
    />
  );
}
