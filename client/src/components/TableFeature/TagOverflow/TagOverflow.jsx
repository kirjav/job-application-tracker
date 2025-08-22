import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./TagOverflow.css";

/**
 * Usage:
 * <TagOverflow
 *   tags={application.tags}              // e.g. [{id: '1', name: 'react'}, ...]
 *   labelKey="name"                      // optional (default: "name")
 *   idKey="id"                           // optional (default: "id")
 *   // or use getLabel / getId if your shape is different
 * />
 */
export default function TagOverflow({
  tags,
  labelKey = "name",
  idKey = "id",
  getLabel,
  getId,
  gap = 8,
  className = "",
  counterTitle = (n) => `${n} more`,
}) {
  const containerRef = useRef(null);
  const measureRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(tags?.length ?? 0);

  // Normalize to { id, label } for internal use
  const items = useMemo(() => {
    const arr = Array.isArray(tags) ? tags : [];
    return arr.map((t, i) => ({
      id: getId ? getId(t) : (t?.[idKey] ?? `tag-${i}`),
      label: getLabel ? getLabel(t) : (t?.[labelKey] ?? String(t)),
    }));
  }, [tags, labelKey, idKey, getLabel, getId]);

  const measure = () => {
    const container = containerRef.current;
    const measureEl = measureRef.current;
    if (!container || !measureEl) return;

    const containerWidth = container.clientWidth;
    if (containerWidth === 0) return;

    const tagRow = measureEl.querySelector(".measure-row");
    const counter = measureEl.querySelector(".measure-counter");
    if (!tagRow || !counter) return;

    tagRow.innerHTML = "";

    // Build measuring elements with the same styles
    const tagWidths = [];
    items.forEach(({ label }) => {
      const el = document.createElement("span");
      el.className = "pill";
      el.textContent = label;
      tagRow.appendChild(el);
      tagWidths.push(el.offsetWidth);
    });

    let sum = 0;
    let fit = 0;

    for (let i = 0; i < tagWidths.length; i++) {
      const widthWithGap = tagWidths[i] + (i > 0 ? gap : 0);
      const remainingIfPlaced = items.length - (i + 1);

      // Reserve space for “+N” if there would be hidden items
      let counterWidth = 0;
      if (remainingIfPlaced > 0) {
        counter.textContent = `+${remainingIfPlaced}`;
        counterWidth = counter.offsetWidth + gap; // include gap before counter
      } else {
        counter.textContent = "";
      }

      if (sum + widthWithGap + counterWidth <= containerWidth) {
        sum += widthWithGap;
        fit = i + 1;
      } else {
        break;
      }
    }

    setVisibleCount(fit);
  };

  useLayoutEffect(measure, [items, gap]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const remaining = items.length - visibleCount;

  return (
    <div className={`tag-overflow ${className}`} ref={containerRef}>
      <div className="tag-row" style={{ gap }}>
        {items.slice(0, visibleCount).map(({ id, label }, i) => (
          <span className="pill" key={id ?? `${label}-${i}`}>{label}</span>
        ))}
        {remaining > 0 && (
          <span className="pill counter" title={counterTitle(remaining)}>
            +{remaining}
          </span>
        )}
      </div>

      {/* hidden measuring area */}
      <div
        ref={measureRef}
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          height: 0,
          overflow: "hidden",
        }}
      >
        <div className="measure-row" style={{ display: "inline-flex", gap }} />
        <span className="pill measure-counter" />
      </div>
    </div>
  );
}
