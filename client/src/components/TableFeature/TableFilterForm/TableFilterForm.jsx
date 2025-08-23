import { useEffect, useState } from "react";
import { MODE_OPTIONS as MODE_VALUES } from "../../../constants/ApplicationModes";
import { STATUS_OPTIONS as STATUS_VALUES } from "../../../constants/ApplicationStatuses";
import ModeToggles from "../FilterModeToggle/ModeToggles";
import TagFilterPicker from "../TagFilterPicker/TagFilterPicker";
import "./TableFilterForm.css";

import { Dropdown } from "../../Popover/Dropdown";
import { Submenu } from "../../Popover/Submenu";

export default function TableFilterForm({ value = {}, onSubmit, selectedCount = 0,
  onBulkUpdateStatus,
  onBulkDelete,
  onExport, }) {
  // local draft state
  const [draft, setDraft] = useState({
    statuses: value.statuses ?? [],
    modes: value.modes ?? [],
    dateFrom: value.dateFrom ?? "",
    dateTo: value.dateTo ?? "",
    salaryMin: value.salaryMin ?? "",
    salaryMax: value.salaryMax ?? "",
    tagNames: value.tagNames ?? [],
    q: value.q ?? "",
  });

  // if parent resets filters, sync draft
  useEffect(() => {
    setDraft({
      statuses: value.statuses ?? [],
      modes: value.modes ?? [],
      dateFrom: value.dateFrom ?? "",
      dateTo: value.dateTo ?? "",
      salaryMin: value.salaryMin ?? "",
      salaryMax: value.salaryMax ?? "",
      tagNames: value.tagNames ?? [],
      q: value.q ?? "",
    });
  }, [JSON.stringify(value)]);

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // normalize empty fields to undefined so your Zod preprocessors behave
    onSubmit?.({
      statuses: draft.statuses?.length ? draft.statuses : undefined,
      modes: draft.modes?.length ? draft.modes : undefined,
      dateFrom: draft.dateFrom || undefined,
      dateTo: draft.dateTo || undefined,
      salaryMin: draft.salaryMin !== "" ? Number(draft.salaryMin) : undefined,
      salaryMax: draft.salaryMax !== "" ? Number(draft.salaryMax) : undefined,
      tagNames: draft.tagNames?.length ? draft.tagNames : undefined,
      q: draft.q || undefined,
    });
  };

  const handleClear = () => {
    const cleared = {
      statuses: [],
      modes: [],
      dateFrom: "",
      dateTo: "",
      salaryMin: "",
      salaryMax: "",
      tagNames: [],
      q: "",
    };
    setDraft(cleared);
    onSubmit?.({}); // clears filters → table refetches
  };

  const [showForm, setShowForm] = useState(false);

  const handleToggle = () => {
    setShowForm(prev => !prev);
  };


  // simple menu item style -- GET RID OF THIS SOON
  const itemStyle = {
    width: "100%",
    textAlign: "left",
    padding: "8px 12px",
    border: 0,
    background: "transparent",
    cursor: "pointer",
    borderRadius: 6,
  };
  const sectionLabelStyle = { padding: "6px 10px", fontWeight: 600, opacity: 0.8 };

  return (
    <div className="filterForm">
      <div className="searchbar">
        <form onSubmit={handleSubmit}>
          <label style={{ flex: 1 }}>
            <input type="search" placeholder="Search" value={draft.q} onChange={(e) => update({ q: e.target.value })} />
          </label><button type="submit">Apply</button></form>
        <button className="toggleFilter" onClick={handleToggle}>Filter</button>

        <Dropdown trigger={<button type="button" className="toggleActions">Actions ▾</button>} align="right">
          {({ close }) => (
            <div role="menu" className="dropdown-menu">
              <button
                type="button"
                className="menu-item"
                onClick={async () => { await onExport?.(); close(); }}
              >
                {selectedCount > 0 ? `Export selected (${selectedCount})` : "Export all (current filters)"}
              </button>

              <Submenu label="Bulk update status…" disabled={selectedCount === 0}>
                {({ close: closeSub }) => (
                  <>
                    {STATUS_VALUES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="menu-item"
                        onClick={async () => { await onBulkUpdateStatus?.(s); closeSub(); close(); }}
                      >
                        {s}
                      </button>
                    ))}
                  </>
                )}
              </Submenu>

              <button
                type="button"
                className="menu-item danger"
                disabled={selectedCount === 0}
                onClick={async () => { await onBulkDelete?.(); close(); }}
              >
                Bulk delete selected
              </button>
            </div>
          )}
        </Dropdown>


      </div>

      {showForm && (<form className="filters" onSubmit={handleSubmit}>
        <label>
          Status
          <select
            multiple
            value={draft.statuses}
            onChange={(e) => update({ statuses: Array.from(e.target.selectedOptions, o => o.value) })}
          >
            {STATUS_VALUES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <ModeToggles
          options={MODE_VALUES}
          value={draft.modes ?? []}
          onChange={(modes) => update({ modes })}
        />

        <label>
          From
          <input type="date" value={draft.dateFrom} onChange={(e) => update({ dateFrom: e.target.value })} />
        </label>
        <label>
          To
          <input type="date" value={draft.dateTo} onChange={(e) => update({ dateTo: e.target.value })} />
        </label>

        <label>
          Min $
          <input type="number" min="0" value={draft.salaryMin} onChange={(e) => update({ salaryMin: e.target.value })} />
        </label>
        <label>
          Max $
          <input type="number" min="0" value={draft.salaryMax} onChange={(e) => update({ salaryMax: e.target.value })} />
        </label>

        <TagFilterPicker
          value={draft.tagNames ?? []}
          onChange={(names) => update({ tagNames: names.length ? names : undefined })}
        />


        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button type="button" onClick={handleClear}>Clear</button>
          <button type="submit">Apply</button>
        </div>
      </form>)}
    </div>
  );
}

