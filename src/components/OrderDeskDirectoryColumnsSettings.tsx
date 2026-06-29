import { useEffect, useState } from "react";
import { ToggleRow } from "@tool-workspace/hub-ui";

type ColumnItem = { key: string; label: string; required?: boolean };

type Props = {
  items: readonly ColumnItem[];
  readVisible: () => Set<string>;
  writeVisible: (cols: Set<string>) => void;
  changeEvent: string;
};

export function OrderDeskDirectoryColumnsSettings({
  items,
  readVisible,
  writeVisible,
  changeEvent,
}: Props) {
  const [visible, setVisible] = useState(() => readVisible());

  useEffect(() => {
    const sync = () => setVisible(readVisible());
    window.addEventListener(changeEvent, sync);
    return () => window.removeEventListener(changeEvent, sync);
  }, [changeEvent, readVisible]);

  function toggle(key: string) {
    const col = items.find((c) => c.key === key);
    if (col?.required) return;
    const next = new Set(visible);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    writeVisible(next);
    setVisible(next);
  }

  return (
    <div className="space-y-0.5">
      {items.map((col) => (
        <ToggleRow
          key={col.key}
          label={col.label}
          on={visible.has(col.key)}
          disabled={col.required}
          onChange={() => toggle(col.key)}
        />
      ))}
    </div>
  );
}
