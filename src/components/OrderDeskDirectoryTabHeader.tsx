import type { ElementType, ReactNode } from "react";
import { HubListChromeHeader, type TabHeaderStatItem } from "@tool-workspace/hub-ui";
import { buildOrderDeskVersionMetaItems } from "../lib/order-desk-tab-header-meta";

type Props = {
  ariaLabel: string;
  title: string;
  titleIcon: ElementType<{ size?: number; className?: string }>;
  titleIconClass?: string;
  centerStats: TabHeaderStatItem[];
  actions?: ReactNode;
};

/** Directory tab header — HubListChromeHeader + version meta (Users golden). */
export function OrderDeskDirectoryTabHeader({
  ariaLabel,
  title,
  titleIcon,
  titleIconClass,
  centerStats,
  actions,
}: Props) {
  return (
    <HubListChromeHeader
      ariaLabel={ariaLabel}
      titleIcon={titleIcon}
      titleIconClass={titleIconClass}
      title={title}
      metaItems={buildOrderDeskVersionMetaItems()}
      centerStats={centerStats}
      actions={actions}
    />
  );
}
