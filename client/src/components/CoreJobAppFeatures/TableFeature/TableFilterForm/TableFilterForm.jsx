import { useEffect, useState, useRef } from "react";

import { MODE_OPTIONS as MODE_VALUES } from "../../../../constants/ApplicationModes";
import { STATUS_OPTIONS as STATUS_VALUES } from "../../../../constants/ApplicationStatuses";

import ModeToggles from "../FilterModeToggle/ModeToggles";
import TagFilterPicker from "../TagFilterPicker/TagFilterPicker";
import "./TableFilterForm.css";

import FilterIcon from "../../../../assets/icons/table/FilterIcon.svg?react";
import ActionsIconGear from "../../../../assets/icons/table/ActionsIconGear.svg?react";
import ThinDownArrow from "../../../../assets/icons/table/ThinDownArrow.svg?react";
import SearchGlassIcon from "../../../../assets/icons/table/SearchGlassIcon.svg?react";

import { Dropdown } from "../../../Popover/Dropdown";
import { Submenu } from "../../../Popover/Submenu";

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

const ref = useRef(null);

useEffect(() => {
  const onPointerDown = (e) => {
    const modal = ref.current;
    if (!modal) return;

    const target = e.target;

    const clickedInsideModal = modal.contains(target);
    const clickedInTagMenu = target.closest?.('[data-tag-menu="true"]');

    if (!clickedInsideModal && !clickedInTagMenu) {
      setShowForm(false);
    }
  };

  document.addEventListener("pointerdown", onPointerDown);
  return () => document.removeEventListener("pointerdown", onPointerDown);
}, []);



  return (
    <div className="filterForm">
      <div className="toolbar">
        <div className="left">
          <form onSubmit={handleSubmit}>
            <label className="search-wrapper">
              <SearchGlassIcon className="search-icon" />
              <input
                type="search"
                placeholder="Search"
                value={draft.q}
                onChange={(e) => update({ q: e.target.value })}
              />
            </label>
            {/*<button type="submit">Apply</button>*/}

            <button
              type="button"
              className="toggleFilter main-button"
              aria-expanded={showForm}
              aria-controls="filters-panel"
              onClick={handleToggle}
            >
              <FilterIcon className="filter-icon" />Filter <ThinDownArrow />
            </button>
          </form>
        </div>

        <div className="right">
          <Dropdown trigger={<button type="button" className="toggleActions main-button"><ActionsIconGear className="action-icon" />Actions <ThinDownArrow /></button>} align="right">
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
          </Dropdown></div>


      </div>


     {showForm && (
  <div className="filter-modal-wrapper" role="dialog" aria-modal="true" aria-label="Filters">
    <form className="filters-modal" onSubmit={handleSubmit} ref={ref}>
      {/* Header */}
      <div className="filters-header">
        <button
          type="button"
          className="filters-close"
          onClick={handleToggle}
          aria-label="Close filters"
        >
          ×
        </button>

        <h2 className="filters-title">Filters</h2>

        {/* spacer to keep title centered */}
        <div className="filters-header-spacer" />
      </div>

      <div className="filters-divider" />

      {/* Work Arrangement */}
      <div className="filters-section">
        <div className="filters-label">Work Arrangement</div>

        <div className="segmented">
          <ModeToggles
            options={MODE_VALUES}
            value={draft.modes ?? []}
            onChange={(modes) => update({ modes })}
          />
        </div>
      </div>

      {/* Date Applied Range */}
      <div className="filters-section">
        <div className="filters-label">Date Applied Range</div>

        <div className="date-pill">
          <input
            className="date-input"
            type="date"
            value={draft.dateFrom}
            onChange={(e) => update({ dateFrom: e.target.value })}
            aria-label="From date"
          />
          <span className="date-sep">–</span>
          <input
            className="date-input"
            type="date"
            value={draft.dateTo}
            onChange={(e) => update({ dateTo: e.target.value })}
            aria-label="To date"
          />
        </div>
      </div>

      {/* Salary */}
      <div className="filters-section">
        <div className="two-col">
          <div>
            <div className="filters-label">Min Salary</div>
            <select
              className="select"
              value={draft.salaryMin ?? ""}
              onChange={(e) => update({ salaryMin: e.target.value })}
            >
              <option value="">No Min</option>
              <option value="50000">50,000</option>
              <option value="75000">75,000</option>
              <option value="100000">100,000</option>
              <option value="125000">125,000</option>
              <option value="150000">150,000</option>
              <option value="175000">175,000</option>
              <option value="200000">200,000</option>
            </select>
          </div>

          <div>
            <div className="filters-label">Max Salary</div>
            <select
              className="select"
              value={draft.salaryMax ?? ""}
              onChange={(e) => update({ salaryMax: e.target.value })}
            >
              <option value="">No Max</option>
              <option value="75000">75,000</option>
              <option value="100000">100,000</option>
              <option value="125000">125,000</option>
              <option value="150000">150,000</option>
              <option value="175000">175,000</option>
              <option value="200000">200,000</option>
              <option value="250000">250,000</option>
              <option value="300000">300,000</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="filters-section">
        <div className="filters-label">Tags</div>
        <div className="boxed">
          <TagFilterPicker
            value={draft.tagNames ?? []}
            onChange={(names) => update({ tagNames: names.length ? names : undefined })}
          />
        </div>
      </div>

      {/* Status */}
      <div className="filters-section">
        <div className="filters-label">Status</div>

        <div className="boxed">
          <div className="pills " >
            {STATUS_VALUES.map((s) => {
              const active = (draft.statuses ?? []).includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  className={`status-pill ${active ? "active" : "unselected"}`}
                  data-status={s}
                  onClick={() => {
                    const set = new Set(draft.statuses ?? []);
                    if (set.has(s)) set.delete(s);
                    else set.add(s);
                    update({ statuses: Array.from(set) });
                  }}
                >
                  {s}
                </button>
              );
            })}
            {/* optional "…" visual if you have many statuses */}
            {/* <span className="pill-ellipsis">…</span> */}
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="filters-footer">
        <button type="button" className="btn-outline" onClick={handleClear}>
          Reset
        </button>
        <button type="submit" className="btn-solid">
          Save
        </button>
      </div>
    </form>
  </div>
)}


    </div >
  );
}

