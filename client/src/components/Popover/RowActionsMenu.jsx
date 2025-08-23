import { Popover } from "./Popover";
import { MenuList } from "./MenuList";

/**
 * Row-level actions for an application row.
 * Props:
 * - appId: string | number
 * - onEdit: (id) => void
 * - onDelete: (id) => void
 * - isOpen: boolean (controlled)
 * - onOpenChange: (open:boolean) => void
 */
export function RowActionsMenu({
  appId,
  onEdit,
  onDelete,
  isOpen,
  onOpenChange,
}) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange} align="right">
      {({ open, setOpen, triggerProps, panelProps }) => (
        <div style={{ position: "relative", display: "inline-block" }}>
          <button
            {...triggerProps}
            aria-label="Row actions"
            style={{
              border: 0,
              background: "transparent",
              cursor: "pointer",
              padding: 4,
              borderRadius: 6,
            }}
            onKeyDown={(e) => {
              // Open with ArrowDown from the trigger for a11y parity
              if (e.key === "ArrowDown" && !open) {
                e.preventDefault();
                setOpen(true);
              }
            }}
          >
            ⋯
          </button>

          {open && (
            <div {...panelProps}>
              <MenuList
                items={[
                  { label: "Edit", onClick: () => onEdit?.(appId) },
                  { label: "Delete", onClick: () => onDelete?.(appId) },
                ]}
                close={() => setOpen(false)}
              />
            </div>
          )}
        </div>
      )}
    </Popover>
  );
}
