// ActiveFilters.jsx
import "./ActiveFilters.css";

import TagClose from "../../../assets/icons/table/tagClose.svg?react";

function isEmpty(val) {
  return (
    val == null ||
    (Array.isArray(val) && val.length === 0) ||
    (typeof val === "string" && val.trim() === "")
  );
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString(); } catch { return iso; }
}

export default function ActiveFilters({ filters, onChange }) {
  const pills = [];

  // Statuses (multi)
  (filters.statuses ?? []).forEach(s => {
    pills.push({
      key: `status:${s}`,
      label: <><strong>Status:</strong> {s}</>,
      remove: () =>
        onChange({ ...filters, statuses: (filters.statuses ?? []).filter(x => x !== s) })
    });
  });

  // Modes (multi)
  (filters.modes ?? []).forEach(m => {
    pills.push({
      key: `mode:${m}`,
      label: <><strong>Mode:</strong> {m}</>,
      remove: () =>
        onChange({ ...filters, modes: (filters.modes ?? []).filter(x => x !== m) })
    });
  });

  // Date range
  if (filters.dateFrom || filters.dateTo) {
    const range =
      (filters.dateFrom ? fmtDate(filters.dateFrom) : "…") +
      " → " +
      (filters.dateTo ? fmtDate(filters.dateTo) : "…");
    pills.push({
      key: "date",
      label: <><strong>Date:</strong> {range}</>,
      remove: () => {
        const next = { ...filters };
        delete next.dateFrom; delete next.dateTo;
        onChange(next);
      }
    });
  }

  // Salary range
  if (filters.salaryMin != null || filters.salaryMax != null) {
    const sMin = filters.salaryMin != null ? `$${Number(filters.salaryMin).toLocaleString()}` : "…";
    const sMax = filters.salaryMax != null ? `$${Number(filters.salaryMax).toLocaleString()}` : "…";
    pills.push({
      key: "salary",
      label: <><strong>Salary:</strong> {sMin} – {sMax}</>,
      remove: () => {
        const next = { ...filters };
        delete next.salaryMin; delete next.salaryMax;
        onChange(next);
      }
    });
  }

  // Tags (multi of ids or names — adapt to your shape)
  (filters.tagNames ?? []).forEach(name => {
    pills.push({
      key: `tag:${name}`,
      label: <><strong>Tag: </strong>{name}</>, // or look up tag name if you have it
      remove: () =>
        onChange({ ...filters, tagNames: (filters.tagNames ?? []).filter(x => x !== name) })
    });
  });

  // Text search
  if (!isEmpty(filters.q)) {
    pills.push({
      key: "q",
      label: <><strong>Search:</strong> {filters.q}</>,
      remove: () => {
        const next = { ...filters };
        delete next.q;
        onChange(next);
      }
    });
  }

  // Nothing active? Render nothing.
  if (pills.length === 0) return null;

  // Clear all
  const clearAll = () => onChange({});

  return (
    <div className="filter-pills" role="status" aria-label="Active filters">
      {pills.map(p => (
        <button
          key={p.key}
          type="button"
          className="pill"
          onClick={p.remove}
          aria-label={`Remove ${p.key}`}
          title="Remove filter"
        >
          {p.label}
          <span className="pill-x" aria-hidden><TagClose/></span>
        </button>
      ))}
      <button type="button" className="pill pill-clear" onClick={clearAll} title="Clear all">
        Clear all
      </button>
    </div>
  );
}
