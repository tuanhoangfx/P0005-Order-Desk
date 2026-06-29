import {
  HubDirectoryBulkActionBar,
  HubDirectoryBulkActionRail,
  HubDirectoryCrudBulkActions,
} from "@tool-workspace/hub-ui";

type Props = {
  hasSelection: boolean;
  selectedCount: number;
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  primaryLabel?: string;
};

export function OrderDeskDirectoryBulkBar({
  hasSelection,
  selectedCount,
  onAdd,
  onEdit,
  onDelete,
  primaryLabel = "Add",
}: Props) {
  return (
    <HubDirectoryBulkActionBar>
      <HubDirectoryBulkActionRail>
        <HubDirectoryCrudBulkActions
          embedded
          hasSelection={hasSelection}
          selectedCount={selectedCount}
          onPrimary={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
          primaryLabel={primaryLabel}
          primaryTitle={`${primaryLabel} row in Order Desk`}
          editTitle="Edit selected row"
          deleteTitle="Delete selected rows"
        />
      </HubDirectoryBulkActionRail>
    </HubDirectoryBulkActionBar>
  );
}
