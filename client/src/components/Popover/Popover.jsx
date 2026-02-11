// src/components/Popover/Popover.jsx
import { useEffect, useLayoutEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Headless popover primitive. Use portal={true} when inside overflow/scroll containers so the panel isn't clipped. */
export function Popover({
  open: controlledOpen,
  onOpenChange,
  side = "bottom",
  align = "right",
  offset = 6,
  portal = false,
  children,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const id = useId();
  const [portalStyle, setPortalStyle] = useState({});

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

  // When using portal, position panel with fixed coords from trigger (layoutEffect so no flash)
  useLayoutEffect(() => {
    if (!portal || !open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    if (side === "right") {
      setPortalStyle({
        position: "fixed",
        top: rect.top,
        left: rect.right + offset,
      });
    } else {
      setPortalStyle({
        position: "fixed",
        top: rect.bottom + offset,
        ...(align === "right"
          ? { right: window.innerWidth - rect.right, left: "auto" }
          : { left: rect.left, right: "auto" }),
      });
    }
  }, [portal, open, side, align, offset]);

  const basePanelStyle = {
    background: "var(--surface-bg)",
    border: "1px solid var(--input-border)",
    borderRadius: 8,
    boxShadow: "0 8px 24px rgba(0,0,0,.25)",
    zIndex: 10000,
    minWidth: 200,
    padding: 4,
    color: "var(--primary-darkest-font-color)",
  };

  const inlinePanelStyle =
    !portal
      ? {
          ...basePanelStyle,
          position: "absolute",
          ...(side === "right"
            ? { left: "100%", top: 0, marginLeft: offset }
            : { top: "100%", [align]: 0, marginTop: offset }),
        }
      : { ...basePanelStyle, ...portalStyle };

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
      style: inlinePanelStyle,
      onClick: (e) => e.stopPropagation(),
    },
    /** When portal is true, render menu content with this to avoid clipping. Otherwise null. */
    renderPanel: portal
      ? (content) =>
          createPortal(
            <div
              id={id}
              ref={panelRef}
              role="menu"
              tabIndex={-1}
              style={inlinePanelStyle}
              onClick={(e) => e.stopPropagation()}
            >
              {content}
            </div>,
            document.body
          )
      : null,
  });
}
