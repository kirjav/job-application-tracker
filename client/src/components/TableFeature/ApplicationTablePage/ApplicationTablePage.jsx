// src/components/ApplicationTablePage/ApplicationTablePage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import qs from "qs";
import API from "../../../utils/api";

import "./ApplicationTablePage.css";

import TableFilterForm from "../TableFilterForm/TableFilterForm";
import ActiveFilters from "../ActiveFilters/ActiveFilters";
import ApplicationTable from "../ApplicationTable/ApplicationTable";
import EditApplication from "../../EditApplication/EditApplication";

import { Dropdown } from "../../Popover/Dropdown";

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

export default function ApplicationTablePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-sourced state
  const [filters, setFilters] = useState(() => readFiltersFromUrl(searchParams));
  const [page, setPage] = useState(() => Number(searchParams.get("page") || 1));
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get("itemsPerPage") || 10));
  const [sortBy, setSortBy] = useState(() => searchParams.get("sortBy") || "dateApplied");
  const [sortDir, setSortDir] = useState(() => searchParams.get("sortDir") || "desc");

  // data + ui
  const [windowData, setWindowData] = useState({ items: [], total: 0, take: 0, skip: 0 });
  const [loading, setLoading] = useState(false);
  const [editAppId, setEditAppId] = useState(null);

  // selection
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  // windowed pagination (5 pages per fetch)
  const windowIndex = useMemo(() => Math.floor((page - 1) / 5), [page]);
  const windowSize = 5 * pageSize;

  // keep URL in sync
  useEffect(() => {
    const params = new URLSearchParams();
    (filters.statuses || []).forEach(v => params.append("statuses", v));
    (filters.modes || []).forEach(v => params.append("modes", v));
    (filters.tagNames || []).forEach(v => params.append("tagNames", v));

    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.q) params.set("q", filters.q);

    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    params.set("itemsPerPage", String(pageSize));
    params.set("page", String(page));
    setSearchParams(params, { replace: true });
  }, [filters, sortBy, sortDir, pageSize, page, setSearchParams]);

  // react to back/forward URL changes
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
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // reset to page 1 when the query shape changes
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set()); // clear selection on a major shape change
  }, [JSON.stringify(filters), sortBy, sortDir, pageSize]);

  // fetch with abort
  const abortRef = useRef(null);

  async function fetchApplications() {
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
      if (!(err && (err.code === "ERR_CANCELED" || err.name === "CanceledError" || err.name === "AbortError"))) {
        console.error("Failed to fetch applications", err);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), sortBy, sortDir, pageSize, windowIndex]);

  // abort on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  // derive current page rows from window
  const idxInWindow = (page - 1) % 5;
  const start = idxInWindow * pageSize;
  const rows = windowData.items.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(windowData.total / pageSize));

  // sorting handler (UI lived in table, but we keep the state here)
  const onSort = (column) => {
    if (sortBy === column) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(column); setSortDir(column === "dateApplied" ? "desc" : "asc"); }
  };

  // selection helpers
  const pageIds = rows.map(r => r.id);
  const selectedOnPage = pageIds.filter(id => selectedIds.has(id));
  const allOnPageSelected = selectedOnPage.length === pageIds.length && pageIds.length > 0;
  const someOnPageSelected = selectedOnPage.length > 0 && !allOnPageSelected;

  const onToggleRow = (id, checked) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };
  const onToggleAllOnPage = (checked) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      rows.forEach(app => { if (checked) next.add(app.id); else next.delete(app.id); });
      return next;
    });
  };

  // bulk status update (example)
  const updateSelectedApplicationStatus = async (newStatus) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!window.confirm(`Update ${ids.length} applications to '${newStatus}'?`)) return;

    setLoading(true);
    try {

      console.log(ids);
      console.log(newStatus);

      await API.patch('/applications/statusUpdate', {
        applicationIds: ids,
        update: { status: newStatus }
      },
        { withCredentials: true },
      );

      setSelectedIds(new Set());
      await fetchApplications();
    } catch (err) {
      if (!(err && (err.code === "ERR_CANCELED" || err.name === "CanceledError" || err.name === "AbortError"))) {
        console.error("Failed bulk update", err);
        alert("Bulk update failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const bulkDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} applications?`)) return;

    setLoading(true);
    try {
      // If you have a bulk endpoint:
      // await API.delete("/applications/bulk", { data: { ids }, withCredentials: true });

      // Fallback: delete one-by-one (still fine; server enforces auth)
      await Promise.all(ids.map((id) => API.delete(`/applications/${id}`, { withCredentials: true })));

      setSelectedIds(new Set());
      await fetchApplications();
    } catch (e) {
      console.error("Bulk delete failed", e);
      alert("Bulk delete failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-table-page">
      <div className="table-topbar">
        <h2>My Applications</h2>
      </div>
      <TableFilterForm
        value={filters}
        onSubmit={setFilters}
        selectedCount={selectedIds.size}
        onBulkUpdateStatus={updateSelectedApplicationStatus}
        onBulkDelete={bulkDeleteSelected}
        // onExport={() => exportCsv(selectedRows, applicationColumns)} // optional
      />
      <ActiveFilters filters={filters} onChange={setFilters} />

      <ApplicationTable
        loading={loading}
        rows={rows}

        // sorting
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={onSort}

        // pagination UI (controlled by page)
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}

        // selection
        selectedIds={selectedIds}
        allOnPageSelected={allOnPageSelected}
        someOnPageSelected={someOnPageSelected}
        onToggleRow={onToggleRow}
        onToggleAllOnPage={onToggleAllOnPage}

        // row actions
        onEdit={setEditAppId}
        onDelete={async (id) => {
          if (!window.confirm("Delete this application?")) return;
          try { await API.delete(`/applications/${id}`); fetchApplications(); }
          catch (e) { console.error(e); }
        }}
      />

      {/* Render Edit modal */}
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
}
