// src/components/Popover/Popover.jsx
import { useEffect, useId, useRef, useState } from "react";

/** Headless popover primitive */
export function Popover({
  open: controlledOpen,
  onOpenChange,
  side = "bottom",      // ⬅️ add: 'bottom' | 'right'
  align = "right",      // for bottom: 'left' | 'right'
  offset = 6,
  children,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const id = useId();

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

  // Position styles
  const panelPos =
    side === "right"
      ? { left: "100%", top: 0, marginLeft: offset }                  // submenu to the right of trigger
      : { top: "100%", [align]: 0, marginTop: offset };               // default dropdown below trigger

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
      tabIndex: -1,
      style: {
        position: "absolute",
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,.12)",
        zIndex: 2000,
        minWidth: 200,
        padding: 4,
        ...panelPos,
      },
      onClick: (e) => e.stopPropagation(),
    },
  });
}
