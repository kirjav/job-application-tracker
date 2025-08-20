import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../../utils/api";
import EditApplication from "../EditApplication/EditApplication";
import TableFilterForm from "../TableFilterForm/TableFilterForm";
import ActiveFilters from "../ActiveFilters/ActiveFilters";
import "./ApplicationTable.css";
import qs from "qs";

const ApplicationTable = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // --- url → filters state
  function readFiltersFromUrl(sp) {
    const f = {};
    const statuses = sp.getAll("statuses");
    const modes = sp.getAll("modes");
    const tagNames = sp.getAll("tagNames");
    const dateFrom = sp.get("dateFrom") || undefined;
    const dateTo = sp.get("dateTo") || undefined;
    const q = sp.get("q") || undefined;

    if (statuses.length) f.statuses = statuses;
    if (modes.length) f.modes = modes;
    if (tagNames.length) f.tagNames = tagNames;
    if (dateFrom) f.dateFrom = dateFrom;
    if (dateTo) f.dateTo = dateTo;
    if (q) f.q = q;
    return f;
  }

  // --- core state
  const [filters, setFilters] = useState(() => readFiltersFromUrl(searchParams));
  const [page, setPage] = useState(() => Number(searchParams.get("page") || 1));
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get("itemsPerPage") || 10));
  const [sortBy, setSortBy] = useState(() => searchParams.get("sortBy") || "dateApplied");
  const [sortDir, setSortDir] = useState(() => searchParams.get("sortDir") || "desc");

  const [windowData, setWindowData] = useState({ items: [], total: 0, take: 0, skip: 0 });
  const [loading, setLoading] = useState(false);
  const [editAppId, setEditAppId] = useState(null);

  const windowIndex = useMemo(() => Math.floor((page - 1) / 5), [page]);
  const windowSize = 5 * pageSize;

  // --- sync URL from state
  useEffect(() => {
    const params = new URLSearchParams();
    (filters.statuses || []).forEach(v => params.append("statuses", v));
    (filters.modes || []).forEach(v => params.append("modes", v));
    (filters.tagNames || []).forEach(n => params.append("tagNames", n));
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.q) params.set("q", filters.q);
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    params.set("itemsPerPage", String(pageSize));
    params.set("page", String(page));
    setSearchParams(params, { replace: true });
  }, [filters, sortBy, sortDir, pageSize, page, setSearchParams]);

  // --- sync state from URL (back/forward)
  useEffect(() => {
    const f = readFiltersFromUrl(searchParams);
    const nextSortBy = searchParams.get("sortBy") || "dateApplied";
    const nextSortDir = searchParams.get("sortDir") || "desc";
    const nextPage = Number(searchParams.get("page") || 1);
    const nextPageSize = Number(searchParams.get("itemsPerPage") || 10);

    if (JSON.stringify(f) !== JSON.stringify(filters)) setFilters(f);
    if (nextSortBy !== sortBy) setSortBy(nextSortBy);
    if (nextSortDir !== sortDir) setSortDir(nextSortDir);
    if (nextPage !== page) setPage(nextPage);
    if (nextPageSize !== pageSize) setPageSize(nextPageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // --- reset page when query shape changes
  useEffect(() => {
    setPage(1);
  }, [JSON.stringify(filters), sortBy, sortDir, pageSize]);

  // --- fetch with AbortController
  const abortRef = useRef(null);
  const fetchApplications = async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await API.get("/applications", {
        params: { ...filters, sortBy, sortDir, itemsPerPage: pageSize, page },
        paramsSerializer: p => qs.stringify(p, { arrayFormat: "repeat" }),
        signal: controller.signal,
      });
      setWindowData({
        items: res.data.items ?? [],
        total: res.data.total ?? 0,
        take: res.data.window?.take ?? windowSize,
        skip: res.data.window?.skip ?? windowIndex * windowSize,
      });
    } catch (err) {
      // axios cancel guard
      if (!(err && (err.code === 'ERR_CANCELED' || err.name === 'CanceledError' || err.name === 'AbortError'))) {
        console.error("Failed to fetch applications", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), sortBy, sortDir, pageSize, windowIndex]);

  useEffect(() => {
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, []);

  // --- window → rows (define BEFORE selection math)
  const idxInWindow = (page - 1) % 5;
  const start = idxInWindow * pageSize;
  const rows = windowData.items.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(windowData.total / pageSize));

  // --- selection column state (AFTER rows exist)
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  useEffect(() => { setSelectedIds(new Set()); }, [JSON.stringify(filters), sortBy, sortDir, pageSize]);

  const pageIds = rows.map(r => r.id);
  const selectedOnPage = pageIds.filter(id => selectedIds.has(id));
  const allOnPageSelected = selectedOnPage.length === pageIds.length && pageIds.length > 0;
  const someOnPageSelected = selectedOnPage.length > 0 && !allOnPageSelected;

  function toggleOne(id, checked) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  }
  function toggleAllCurrent(checked) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      rows.forEach(app => { if (checked) next.add(app.id); else next.delete(app.id); });
      return next;
    });
  }

  const headerCbRef = useRef(null);
  useEffect(() => {
    if (headerCbRef.current) headerCbRef.current.indeterminate = someOnPageSelected;
  }, [someOnPageSelected, allOnPageSelected, page]);

  // --- sorting helpers
  function toggleSort(column) {
    if (sortBy === column) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(column); setSortDir(column === "dateApplied" ? "desc" : "asc"); }
  }
  const caret = col => (sortBy === col ? (sortDir === "asc" ? " ▲" : " ▼") : "");
  const ariaSort = col => (sortBy === col ? (sortDir === "asc" ? "ascending" : "descending") : "none");

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;
    try { await API.delete(`/applications/${id}`); fetchApplications(); }
    catch (e) { console.error(e); }
  };

  return (
    <div className="app-table">
      <TableFilterForm value={filters} onSubmit={setFilters} />
      <ActiveFilters filters={filters} onChange={setFilters} />

      <div className="table-topbar">
        <h2>Applications</h2>
        <label style={{ marginLeft: "auto" }}>
          Rows:
          <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
            {[10, 20, 30, 50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

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
                  onChange={(e) => toggleAllCurrent(e.target.checked)}
                  aria-label="Select all on this page"
                />
              </th>
              <th aria-sort={ariaSort("company")}><button type="button" className="th-sort" onClick={() => toggleSort("company")}>Company{caret("company")}</button></th>
              <th aria-sort={ariaSort("position")}><button type="button" className="th-sort" onClick={() => toggleSort("position")}>Position{caret("position")}</button></th>
              <th aria-sort={ariaSort("status")}><button type="button" className="th-sort" onClick={() => toggleSort("status")}>Status{caret("status")}</button></th>
              <th aria-sort={ariaSort("mode")}><button type="button" className="th-sort" onClick={() => toggleSort("mode")}>Mode{caret("mode")}</button></th>
              <th aria-sort={ariaSort("dateApplied")}><button type="button" className="th-sort" onClick={() => toggleSort("dateApplied")}>Date Applied{caret("dateApplied")}</button></th>
              <th aria-sort={ariaSort("salary")}><button type="button" className="th-sort" onClick={() => toggleSort("salary")}>Salary{caret("salary")}</button></th>
              <th>Tags</th>
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
                    onChange={(e) => toggleOne(app.id, e.target.checked)}
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
                <td className="tag-cell">
                  {app.tags?.length ? (
                    <div className="tags">
                      {app.tags.map(t => (
                        <span key={t.id} className="tag-chip">{t.name}</span>
                      ))}
                    </div>
                  ) : "—"}
                </td>
                <td>
                  <button onClick={() => setEditAppId(app.id)}>Edit</button>
                  <button onClick={() => handleDelete(app.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="pager" style={{ marginTop: "1rem" }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</button>
        <span style={{ margin: "0 1rem" }}>Page {page} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
      </div>

      {editAppId && (
        <div className="modal">
          <EditApplication
            applicationId={editAppId}
            onSuccess={() => { setEditAppId(null); fetchApplications(); }}
            onClose={() => setEditAppId(null)}
          />
        </div>
      )}
    </div>
  );
};

export default ApplicationTable;
