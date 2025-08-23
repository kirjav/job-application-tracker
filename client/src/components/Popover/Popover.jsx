import { useEffect, useId, useRef, useState } from "react";

/**
 * Headless popover: handles open/close, outside click, Escape, and focus return.
 * Usage (render prop):
 * <Popover>
 *   {({ open, setOpen, triggerProps, panelProps }) => (
 *     <div style={{ position: "relative", display: "inline-block" }}>
 *       <button {...triggerProps}>Open ▾</button>
 *       {open && <div {...panelProps}>...content...</div>}
 *     </div>
 *   )}
 * </Popover>
 */
export function Popover({
  open: controlledOpen,
  onOpenChange,
  align = "right", // 'left' | 'right'
  offset = 6,
  children,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const id = useId();

  // Close on outside click and Escape; return focus to trigger
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      if (!panelRef.current || !btnRef.current) return;
      const inPanel = panelRef.current.contains(e.target);
      const inButton = btnRef.current.contains(e.target);
      if (!inPanel && !inButton) setOpen(false);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  return children({
    open,
    setOpen,
    triggerProps: {
      ref: btnRef,
      type: "button",
      "aria-haspopup": "menu",
      "aria-expanded": open,
      "aria-controls": id,
      onClick: () => setOpen((o) => !o),
    },
    panelProps: {
      id,
      ref: panelRef,
      role: "menu",
      style: {
        position: "absolute",
        top: "100%",
        [align]: 0,
        marginTop: offset,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,.12)",
        zIndex: 1000,
        minWidth: 180,
      },
      // Stop clicks inside panel from bubbling to the outside-click handler
      onClick: (e) => e.stopPropagation(),
    },
  });
}
