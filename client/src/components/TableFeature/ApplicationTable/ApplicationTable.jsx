// src/components/ApplicationTable/ApplicationTable.jsx
import { useEffect, useRef } from "react";
import "./ApplicationTable.css";
import TagOverflow from "../TagOverflow/TagOverflow";
import { Dropdown } from "../../Popover/Dropdown";
import { StatusDisplay } from "../StatusDisplay/StatusDisplay";

{/** Nav Icon SVGs */ }
import TableSortedDownArrow from "../../../assets/icons/table/TableSortedDownArrow.svg?react";
import TableSortedUpArrow from "../../../assets/icons/table/TableSortedUpArrow.svg?react";
import TableSortOptionArrow from "../../../assets/icons/table/TableSortOptionArrow.svg?react";

import ThinLeftArrow from "../../../assets/icons/table/ThinLeftArrow.svg?react";
import ThinRightArrow from "../../../assets/icons/table/ThinRightArrow.svg?react";

import TableRowOptions from "../../../assets/icons/table/TableRowOptions.svg?react";


export default function ApplicationTable({
  loading,
  rows,

  // sorting
  sortBy,
  sortDir,
  onSort,

  // pagination (UI lives here; state lives in parent)
  page,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,

  // selection
  selectedIds,
  allOnPageSelected,
  someOnPageSelected,
  onToggleRow,
  onToggleAllOnPage,

  // row actions
  onEdit,
  onDelete,
}) {
  const headerCbRef = useRef(null);
  useEffect(() => {
    if (headerCbRef.current) headerCbRef.current.indeterminate = someOnPageSelected;
  }, [someOnPageSelected]);

  const caret = (col) => (sortBy === col ? (sortDir === "asc" ? <TableSortedUpArrow className="sorted" aria-hidden="true" focusable="false"/> : <TableSortedDownArrow className="sorted" aria-hidden="true" focusable="false" />) : <TableSortOptionArrow aria-hidden="true" focusable="false" className="unsorted" />);
  const ariaSort = (col) => (sortBy === col ? (sortDir === "asc" ? "ascending" : "descending") : "none");

  return (
    <div className="app-table" aria-busy={loading ? "true" : "false"}>
      {loading ? (
        <p role="status" aria-live="polite">Loading…</p>
      ) : rows.length === 0 ? (
        <p role="status" aria-live="polite">No applications found.</p>
      ) : (
        <table>
          <caption className="sr-only">Job applications</caption>
          <thead>
            <tr>
              <th className="select-col">
                <input
                  ref={headerCbRef}
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={(e) => onToggleAllOnPage(e.target.checked)}
                  aria-label="Select all on this page"
                />
              </th>

              <th aria-sort={ariaSort("company")} className="company-col">
                <button type="button" className="th-sort" onClick={() => onSort("company")}>
                  <span>Company</span>{caret("company")}
                </button>
              </th>

              <th aria-sort={ariaSort("position")}>
                <button type="button" className="th-sort" onClick={() => onSort("position")}>
                  Position{caret("position")}
                </button>
              </th>

              <th aria-sort={ariaSort("status")} className="status-col">
                <button type="button" className="th-sort" onClick={() => onSort("status")}>
                  <span>Status</span>{caret("status")}
                </button>
              </th>

              <th aria-sort={ariaSort("mode")} className="mode-col">
                <button type="button" className="th-sort" onClick={() => onSort("mode")}>
                  <span>Mode</span>{caret("mode")}
                </button>
              </th>

              <th aria-sort={ariaSort("dateApplied")} className="date-col">
                <button type="button" className="th-sort" onClick={() => onSort("dateApplied")}>
                  <span>Date Applied</span>{caret("dateApplied")}
                </button>
              </th>

              <th aria-sort={ariaSort("salary")} className="salary-col">
                <button type="button" className="th-sort" onClick={() => onSort("salary")}>
                  <span>Salary</span>{caret("salary")}
                </button>
              </th>

              <th aria-sort="none" className="tag-col"><span>Tags</span></th>
              <th className="row-actions-col"><TableRowOptions /></th>
            </tr>
          </thead>

          <tbody>
            {rows.map(app => (
              <tr key={app.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(app.id)}
                    onChange={(e) => onToggleRow(app.id, e.target.checked)}
                    aria-label={`Select ${app.company} – ${app.position}`}
                  />
                </td>

                <td className="text-col"><span className="company-col">{app.company}</span></td>
                <td className="text-col">{app.position}</td>
                <td className="status-td"><div className="status-display"><StatusDisplay statusType={app.status} aria-label={app.status} /></div></td>
                <td>{app.mode}</td>
                <td>{new Date(app.dateApplied).toLocaleDateString()}</td>

                <td>
                  {app.salaryExact != null
                    ? `$${app.salaryExact.toLocaleString()}`
                    : (app.salaryMin != null || app.salaryMax != null)
                      ? `$${(app.salaryMin ?? 0).toLocaleString()}–$${(app.salaryMax ?? 0).toLocaleString()}`
                      : "—"}
                </td>

                <td className="tag-cell" style={{ width: "200px" }}>
                  {app.tags?.length ? (
                    <div className="tags">
                      <TagOverflow tags={app.tags} />

                    </div>
                  ) : "—"}
                </td>

                <td className="row-actions-dropdown">
                  <Dropdown trigger={<button type="button" aria-label="Row actions" style={{ border: 0, background: "transparent", cursor: "pointer", padding: 4 }}><TableRowOptions /></button>} align="right">
                    {({ close }) => (
                      <div role="menu" className="dropdown-menu">
                        <button className="menu-item" type="button" onClick={() => { onEdit(app.id); close(); }}>
                          Edit
                        </button>
                        <button className="menu-item danger" type="button" onClick={() => { onDelete(app.id); close(); }}>
                          Delete
                        </button>
                      </div>
                    )}
                  </Dropdown>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      )}

      {/* Pagination UI (controlled) */}
      <div className="pagination-controls">
        <div className="pager" aria-label="Pagination">
          <button
            className="pagination-direction"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ThinLeftArrow aria-hidden="true" focusable="false" />
          </button>

          <span aria-live="polite" style={{ margin: "0 1rem" }}>
            Page {page} of {totalPages}
          </span>

          <button
            className="pagination-direction"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ThinRightArrow aria-hidden="true" focusable="false" />
          </button>
        </div>
        <div className="row-count-selection">
          <label htmlFor="pageSize">Rows:</label>
          <select id="pageSize" value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))}>
            {[10, 20, 30, 50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
