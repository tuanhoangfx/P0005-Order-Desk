import { OVERVIEW_TOC } from "./overview-toc";
import { TocSectionNav } from "./TocSectionNav";

export function OverviewTocNav({
  idPrefix = "",
  scrollRootSelector,
}: {
  idPrefix?: string;
  scrollRootSelector?: string;
}) {
  return <TocSectionNav items={OVERVIEW_TOC} idPrefix={idPrefix} scrollRootSelector={scrollRootSelector} />;
}

