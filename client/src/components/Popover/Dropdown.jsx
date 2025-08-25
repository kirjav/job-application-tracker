// Dropdown.jsx
import { cloneElement, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import { Popover } from "./Popover.jsx";

/**
 * Usage:
 * <Dropdown trigger={<button>Actions</button>} align="right">
 *   {({ close, getItemProps }) => (
 *     <>
 *       <button {...getItemProps()} onClick={() => { onEdit(); close(); }}>Edit</button>
 *       <button {...getItemProps()} onClick={() => { onDelete(); close(); }}>Delete</button>
 *     </>
 *   )}
 * </Dropdown>
 */
export function Dropdown({ trigger, align = "right", offset = 6, children }) {
  const itemRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const resetItems = () => {
    itemRefs.current = [];
    setActiveIndex(-1);
  };

  const focusItem = (idx) => {
    if (idx < 0 || idx >= itemRefs.current.length) return;
    const el = itemRefs.current[idx];
    if (!el || el.getAttribute("aria-disabled") === "true") return;
    el.focus();
    setActiveIndex(idx);
  };

  const getEnabledIndexes = () =>
    itemRefs.current
      .map((el, i) => (el && el.getAttribute("aria-disabled") !== "true" ? i : null))
      .filter((i) => i !== null);

  const getFirstEnabled = () => getEnabledIndexes()[0] ?? -1;
  const getLastEnabled = () => {
    const all = getEnabledIndexes();
    return all.length ? all[all.length - 1] : -1;
  };

  return (
    <Popover align={align} offset={offset}>
      {({ open, setOpen, triggerProps, panelProps }) => {
        // Make trigger keyboard-open aware (ArrowDown opens + focuses first item)
        const enhancedTriggerProps = {
          ...triggerProps,
          onKeyDown: (e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              // focus first on next tick
              requestAnimationFrame(() => focusItem(getFirstEnabled()));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              requestAnimationFrame(() => focusItem(getLastEnabled()));
            }
            triggerProps.onKeyDown?.(e);
          },
        };

        const triggerEl = isValidElement(trigger)
          ? cloneElement(trigger, {
              ...enhancedTriggerProps,
              onClick: (e) => {
                trigger.props?.onClick?.(e);
                enhancedTriggerProps.onClick?.(e);
              },
              "aria-haspopup": "menu",
              "aria-expanded": open,
              "aria-controls": panelProps.id,
            })
          : (
            <button type="button" {...enhancedTriggerProps}>
              {trigger}
            </button>
          );

        // When menu opens, focus first enabled item
        useEffect(() => {
          if (open) {
            requestAnimationFrame(() => {
              const first = getFirstEnabled();
              if (first !== -1) focusItem(first);
            });
          } else {
            resetItems();
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [open]);

        const onMenuKeyDown = (e) => {
          const count = itemRefs.current.length;
          if (!count) return;

          if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
            // Return focus to trigger
            requestAnimationFrame(() => {
              const btn = panelProps && panelProps["aria-controls"] ? document.getElementById(panelProps["aria-controls"]) : null;
              // ^ not reliable; Popover already refocuses trigger on Escape, so we can rely on that.
            });
          } else if (e.key === "Tab") {
            // close on Tab, let focus move naturally
            setOpen(false);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            const enabled = getEnabledIndexes();
            if (!enabled.length) return;
            const idx = enabled.indexOf(activeIndex);
            const next = enabled[(idx + 1) % enabled.length];
            focusItem(next);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const enabled = getEnabledIndexes();
            if (!enabled.length) return;
            const idx = enabled.indexOf(activeIndex);
            const prev = enabled[(idx - 1 + enabled.length) % enabled.length];
            focusItem(prev);
          } else if (e.key === "Home") {
            e.preventDefault();
            const first = getFirstEnabled();
            if (first !== -1) focusItem(first);
          } else if (e.key === "End") {
            e.preventDefault();
            const last = getLastEnabled();
            if (last !== -1) focusItem(last);
          } else if (e.key === "Enter" || e.key === " ") {
            // Let the focused item’s onClick handle it
            // (Browsers usually click focused button on Space/Enter already)
          }
        };

        const getItemProps = (opts = {}) => {
          const { disabled = false, role = "menuitem" } = opts;
          const index = itemRefs.current.length; // the next slot

          return {
            ref: (el) => {
              if (el) {
                itemRefs.current[index] = el;
              }
            },
            role,
            tabIndex: index === 0 ? 0 : -1, // initial tab stop; we move focus programmatically
            "aria-disabled": disabled ? "true" : undefined,
            onKeyDown: (e) => {
              // Stop Arrow keys from scrolling page if any slip through
              if (["ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) {
                e.preventDefault();
              }
            },
          };
        };

        return (
          <div style={{ position: "relative", display: "inline-block" }}>
            {triggerEl}
            {open && (
              <div
                {...panelProps}
                // menu container keyboard handling
                onKeyDown={(e) => {
                  onMenuKeyDown(e);
                  panelProps.onKeyDown?.(e);
                }}
              >
                {/* Consumers provide items; we enhance them via getItemProps */}
                {typeof children === "function"
                  ? children({ close: () => setOpen(false), getItemProps })
                  : children}
              </div>
            )}
          </div>
        );
      }}
    </Popover>
  );
}
