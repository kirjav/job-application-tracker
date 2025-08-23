import { cloneElement, isValidElement } from "react";
import { Popover } from "./Popover.jsx";

/**
 * <Dropdown trigger={<button>Actions ▾</button>} align="right">
 *   {({ close }) => (
 *     <>
 *       <button type="button" onClick={() => { doThing(); close(); }}>Do thing</button>
 *       ...
 *     </>
 *   )}
 * </Dropdown>
 */
export function Dropdown({ trigger, align = "right", offset = 6, children }) {
  return (
    <Popover align={align} offset={offset}>
      {({ open, setOpen, triggerProps, panelProps }) => {
        const triggerEl = isValidElement(trigger)
          ? cloneElement(trigger, {
              ...triggerProps,
              onClick: (e) => {
                trigger.props?.onClick?.(e);
                triggerProps.onClick?.(e);
              },
            })
          : (
            <button type="button" {...triggerProps}>
              {trigger}
            </button>
          );

        return (
          <div style={{ position: "relative", display: "inline-block" }}>
            {triggerEl}
            {open && (
              <div {...panelProps}>
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
