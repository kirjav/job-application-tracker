import { useEffect, useState } from "react";
import "./ModeToggles.css";

export default function ModeToggles({ label = "Work Arrangement", options, value = [], onChange }) {
  const toggle = (opt) => {
    const next = value.includes(opt)
      ? value.filter(v => v !== opt)
      : [...value, opt];
    onChange(next);
  };

  return (
    <fieldset className="toggle-group-filter-modal">
     <label>{label}</label>
      <div className="toggle-row">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            className={`mode-toggle ${value.includes(opt) ? "is-selected" : ""}`}
            onClick={() => toggle(opt)}
            aria-pressed={value.includes(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
