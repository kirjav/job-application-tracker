import { useState } from "react";
import { Popover } from "./Popover.jsx";
import { MenuList } from "./MenuList.jsx";
import { STATUS_OPTIONS } from "../../constants/ApplicationStatuses.js";

/**
 * Props:
 * - selectedCount: number
 * - onExport: () => void
 * - onBulkUpdateStatus: (status: string) => void
 * - onBulkDelete: () => void
 * - statusOptions?: string[]  // optional override
 * - align?: 'left' | 'right'
 */
export function GlobalActionsMenu({
    selectedCount = 0,
    onExport,
    onBulkUpdateStatus,
    onBulkDelete,
    align = "right",
}) {
    const [mode, setMode] = useState("root"); // 'root' | 'status'
    const statusOptions = STATUS_OPTIONS;

  return (
    <Popover align={align}>
      {({ open, setOpen, triggerProps, panelProps }) => (
        <div style={{ position: "relative", display: "inline-block" }}>
          <button
            {...triggerProps}
            type="button"
            aria-label="Global actions"
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" }}
            onClick={(e) => { triggerProps.onClick?.(e); setMode("root"); }}
          >
            Actions ▾
          </button>

          {open && (
            <div {...panelProps} style={{ ...panelProps.style, minWidth: 220 }}>
              {mode === "root" && (
                <MenuList
                  items={[
                    { label: `Export selected (${selectedCount})`, onClick: onExport, disabled: false /* allow export even at 0; handle inside */ },
                    { label: "Bulk update status…", onClick: () => setMode("status"), disabled: selectedCount === 0, keepOpen: true }, // ✅
                    { label: `Bulk delete selected (${selectedCount})`, onClick: onBulkDelete, disabled: selectedCount === 0 },
                  ]}
                  close={() => setOpen(false)}
                />
              )}

              {mode === "status" && (
                <div role="menu" style={{ padding: 4 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 8px 8px" }}>
                    <button type="button" onClick={() => setMode("root")} style={{ border: 0, background: "transparent", cursor: "pointer" }} aria-label="Back">←</button>
                    <strong>Set status to…</strong>
                  </div>
                  <MenuList
                    items={statusOptions.map((s) => ({ key: s, label: s, onClick: () => onBulkUpdateStatus?.(s) }))}
                    close={() => setOpen(false)} // submenu items should close
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Popover>
  );
}