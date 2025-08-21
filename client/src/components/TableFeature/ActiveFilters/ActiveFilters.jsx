// ActiveFilters.jsx
import React from "react";
import "./ActiveFilters.css";

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
      label: <>Status: <strong>{s}</strong></>,
      remove: () =>
        onChange({ ...filters, statuses: (filters.statuses ?? []).filter(x => x !== s) })
    });
  });

  // Modes (multi)
  (filters.modes ?? []).forEach(m => {
    pills.push({
      key: `mode:${m}`,
      label: <>Mode: <strong>{m}</strong></>,
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
      label: <>Date: <strong>{range}</strong></>,
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
      label: <>Salary: <strong>{sMin} – {sMax}</strong></>,
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
      label: <>Tag: {name}</>, // or look up tag name if you have it
      remove: () =>
        onChange({ ...filters, tagNames: (filters.tagNames ?? []).filter(x => x !== name) })
    });
  });

  // Text search
  if (!isEmpty(filters.q)) {
    pills.push({
      key: "q",
      label: <>Search: <strong>{filters.q}</strong></>,
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
          <span className="pill-x" aria-hidden>×</span>
        </button>
      ))}
      <button type="button" className="pill pill-clear" onClick={clearAll} title="Clear all">
        Clear all
      </button>
    </div>
  );
}
