// src/components/Popover/MenuList.jsx
import { useEffect, useRef } from "react";

/** items: [{ key?, label, onClick, disabled, keepOpen? }] */
export function MenuList({ items = [], onSelect, close }) {
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const buttons = () => Array.from(el.querySelectorAll('button[role="menuitem"]:not(:disabled)'));
    const onKey = (e) => {
      const bs = buttons();
      if (!bs.length) return;
      const idx = bs.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); bs[(idx + 1 + bs.length) % bs.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); bs[(idx - 1 + bs.length) % bs.length].focus(); }
      else if (e.key === "Home") { e.preventDefault(); bs[0].focus(); }
      else if (e.key === "End") { e.preventDefault(); bs[bs.length - 1].focus(); }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ul ref={listRef} role="menu" style={{ listStyle: "none", margin: 0, padding: 4 }}>
      {items.map((it) => (
        <li key={it.key ?? it.label} role="none">
          <button
            type="button"
            role="menuitem"
            disabled={it.disabled}
            onClick={() => {
              it.onClick?.();
              onSelect?.(it);
              if (!it.keepOpen) close?.();
            }}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "8px 12px",
              border: 0,
              background: "transparent",
              cursor: it.disabled ? "not-allowed" : "pointer",
              borderRadius: 6,
            }}
            onMouseEnter={(e) => e.currentTarget.focus()}
          >
            {it.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

