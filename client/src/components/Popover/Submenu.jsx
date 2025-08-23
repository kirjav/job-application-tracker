// src/components/Popover/Submenu.jsx
import { useEffect, useRef } from "react";
import { Popover } from "./Popover.jsx";

export function Submenu({
  label,
  disabled = false,
  children,
  hoverOpenDelay = 60,   // ms
  hoverCloseDelay = 120, // ms
}) {
  const openTimer = useRef(null);
  const closeTimer = useRef(null);

  const clearTimers = () => {
    if (openTimer.current) { clearTimeout(openTimer.current); openTimer.current = null; }
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  };

  useEffect(() => () => clearTimers(), []);

  return (
    <Popover side="right" offset={6}>
      {({ open, setOpen, triggerProps, panelProps }) => {
        const panelEl = () => panelProps.ref?.current;
        const triggerEl = () => triggerProps.ref?.current;

        const handleEnter = () => {
          if (disabled) return;
          clearTimeout(closeTimer.current);
          openTimer.current = setTimeout(() => setOpen(true), hoverOpenDelay);
        };

        const handleLeave = (e) => {
          // If moving into the submenu panel or back onto the trigger, don't close
          const next = e.relatedTarget;
          if (next && (panelEl()?.contains(next) || triggerEl()?.contains(next))) return;

          clearTimeout(openTimer.current);
          closeTimer.current = setTimeout(() => setOpen(false), hoverCloseDelay);
        };

        const handlePanelEnter = () => {
          clearTimeout(closeTimer.current);
        };

        const handlePanelLeave = (e) => {
          const next = e.relatedTarget;
          // If moving back to the trigger, don't close yet
          if (next && triggerEl()?.contains(next)) return;
          closeTimer.current = setTimeout(() => setOpen(false), hoverCloseDelay);
        };

        return (
          <div
            style={{ position: "relative" }}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          >
            <button
              {...triggerProps}
              type="button"
              disabled={disabled}
              className="menu-item"
              onClick={(e) => {
                // Allow click to open
                triggerProps.onClick?.(e);
                if (!open && !disabled) setOpen(true);
              }}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === "ArrowRight") { e.preventDefault(); setOpen(true); }
                if (e.key === "ArrowLeft")  { e.preventDefault(); setOpen(false); triggerEl()?.focus(); }
              }}
            >
              <span style={{ flex: 1 }}>{label}</span>
              <span aria-hidden>›</span>
            </button>

            {open && (
              <div
                {...panelProps}
                className="dropdown-menu"
                onMouseEnter={handlePanelEnter}
                onMouseLeave={handlePanelLeave}
              >
                {typeof children === "function"
                  ? children({ close: () => setOpen(false) })
                  : children}
              </div>
            )}
          </div>
        );
      }}
    </Popover>
  );
}
