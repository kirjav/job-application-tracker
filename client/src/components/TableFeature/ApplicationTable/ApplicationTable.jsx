// src/components/ApplicationTable/ApplicationTable.jsx
import { useEffect, useRef } from "react";
import "./ApplicationTable.css";
import TagOverflow from "../TagOverflow/TagOverflow";
import { Dropdown } from "../../Popover/Dropdown";

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

  const caret = (col) => (sortBy === col ? (sortDir === "asc" ? " ▲" : " ▼") : "<>");
  const ariaSort = (col) => (sortBy === col ? (sortDir === "asc" ? "ascending" : "descending") : "none");

  return (
    <div className="app-table">
      {loading ? (
        <p>Loading...</p>
      ) : rows.length === 0 ? (
        <p>No applications found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>
                <input
                  ref={headerCbRef}
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={(e) => onToggleAllOnPage(e.target.checked)}
                  aria-label="Select all on this page"
                />
              </th>

              <th aria-sort={ariaSort("company")}>
                <button type="button" className="th-sort" onClick={() => onSort("company")}>
                  Company{caret("company")}
                </button>
              </th>

              <th aria-sort={ariaSort("position")}>
                <button type="button" className="th-sort" onClick={() => onSort("position")}>
                  Position{caret("position")}
                </button>
              </th>

              <th aria-sort={ariaSort("status")}>
                <button type="button" className="th-sort" onClick={() => onSort("status")}>
                  Status{caret("status")}
                </button>
              </th>

              <th aria-sort={ariaSort("mode")}>
                <button type="button" className="th-sort" onClick={() => onSort("mode")}>
                  Mode{caret("mode")}
                </button>
              </th>

              <th aria-sort={ariaSort("dateApplied")}>
                <button type="button" className="th-sort" onClick={() => onSort("dateApplied")}>
                  Date Applied{caret("dateApplied")}
                </button>
              </th>

              <th aria-sort={ariaSort("salary")}>
                <button type="button" className="th-sort" onClick={() => onSort("salary")}>
                  Salary{caret("salary")}
                </button>
              </th>

              <th aria-sort="none">Tags</th>
              <th>Actions</th>
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

                <td>{app.company}</td>
                <td>{app.position}</td>
                <td>{app.status}</td>
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

                <td>

                  <Dropdown trigger={<button type="button" aria-label="Row actions" style={{ border: 0, background: "transparent", cursor: "pointer", padding: 4 }}>⋯</button>} align="right">
                    {({ close }) => (
                      <div role="menu" style={{ minWidth: 160 }}>
                        <button type="button" onClick={() => { onEdit(app.id); close(); }}>
                          Edit
                        </button>
                        <button type="button" onClick={() => { onDelete(app.id); close(); }}>
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

      <label style={{ marginLeft: "auto" }}>
        Rows:
        <select value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))}>
          {[10, 20, 30, 50].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <div className="pager" style={{ marginTop: "1rem" }}>
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>
          Previous
        </button>
        <span style={{ margin: "0 1rem" }}>
          Page {page} of {totalPages}
        </span>

        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}
