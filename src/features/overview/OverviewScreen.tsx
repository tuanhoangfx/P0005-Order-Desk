import { BookOpenText, Link2, Recycle } from "lucide-react";
import { AppTabHeader } from "@tool-workspace/hub-ui";
import { OrderDeskTabHeaderActions } from "../../components/OrderDeskTabHeaderActions";
import { OverviewTocNav } from "./OverviewTocNav";

const LINKS = [
  {
    title: "CzP Seller Sheets",
    detail: "docs/SHEETS-INTEGRATION.md — Buyer tab (CS01xxx) + Order List (OI27xxxx) import mapping.",
  },
  {
    title: "P0020 Account vault",
    detail: "orders.twofa_account_id → twofa_accounts (service login row). No secrets copied.",
  },
  {
    title: "P0016 Chat Center",
    detail: "chat_bot_id + chat_thread_id → deep link inbox only. No message sync.",
  },
  {
    title: "Contract",
    detail: "docs/CROSS-TOOL-CONTRACT.md v0.1",
  },
];

export function OverviewScreen() {
  const headerActions = <OrderDeskTabHeaderActions screen="overview" />;

  return (
    <section className="order-desk-screen">
      <AppTabHeader
        ariaLabel="Overview header"
        titleIcon={BookOpenText}
        titleIconClass="text-amber-300"
        title="Overview"
        metaItems={[{ icon: Recycle, value: "Recycled code P0005 · not P0025 TeleGroup" }]}
        centerStats={[]}
        actions={headerActions}
      />
      <div className="flex min-h-0 flex-1 items-start gap-4">
        <OverviewTocNav scrollRootSelector=".order-desk-overview-scroll" />
        <article className="order-desk-overview-scroll min-w-0 flex-1 rounded-2xl border border-white/6 bg-[var(--panel)] p-5">
          <section id="about" className="scroll-mt-24">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
              <Link2 size={16} className="text-indigo-300" />
              About
            </div>
            <div className="mt-2 text-sm text-[var(--muted)]">
              Order Desk manages buyers and orders, linking to P0020 vault and P0016 inbox threads without copying secrets or messages.
            </div>
          </section>

          <hr className="my-5 border-white/6" />

          <section id="links" className="scroll-mt-24">
            <div className="text-sm font-semibold text-[var(--text)]">Links</div>
            <ul className="mt-3 space-y-3 text-sm text-[var(--muted)]">
              {LINKS.map((row) => (
                <li key={row.title} className="rounded-xl border border-white/6 bg-black/10 p-3">
                  <div className="font-medium text-[var(--text)]">{row.title}</div>
                  <div className="mt-1">{row.detail}</div>
                </li>
              ))}
            </ul>
          </section>

          <hr className="my-5 border-white/6" />

          <section id="sheets" className="scroll-mt-24">
            <div className="text-sm font-semibold text-[var(--text)]">Sheets bridge</div>
            <div className="mt-2 text-sm text-[var(--muted)]">
              One-time seed from CzP Seller Google Sheet (Buyer + Order List) into your Order Desk tables.
              After import, create and manage customers/orders entirely in P0005 — no P0020 sheet_sources registry.
            </div>
          </section>

          <hr className="my-5 border-white/6" />

          <section id="roadmap" className="scroll-mt-24">
            <div className="text-sm font-semibold text-[var(--text)]">Roadmap</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
              <li>Phase A: one-time sheet seed + directory parity (Import sheet button)</li>
              <li>Phase B: CRUD in P0005 + vault/chat links</li>
              <li>Phase C: P0005 SSOT — sheet export only when needed</li>
            </ul>
          </section>
        </article>
      </div>
    </section>
  );
}
