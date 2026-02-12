// src/components/ApplicationTablePage/ApplicationTablePage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import qs from "qs";
import API from "../../../../utils/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ── CSV export helpers ───────────────────────────────────────
function escapeCsv(val) {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatMoney(val) {
  if (val == null || val === "") return "";
  return Number(val).toLocaleString("en-US");
}

function applicationsToCsv(apps) {
  const headers = [
    "Company", "Position", "Status", "Work Arrangement",
    "Date Applied", "Exact Salary", "Min Salary", "Max Salary",
    "Source", "Notes", "Tailored Resume", "Tailored Cover Letter", "Tags",
  ];
  const lines = [headers.map(escapeCsv).join(",")];
  for (const a of apps) {
    const row = [
      a.company,
      a.position,
      a.status,
      a.mode,
      a.dateApplied ? a.dateApplied.split("T")[0] : "",
      formatMoney(a.salaryExact),
      formatMoney(a.salaryMin),
      formatMoney(a.salaryMax),
      a.source,
      a.notes,
      a.tailoredResume ? "Yes" : "No",
      a.tailoredCoverLetter ? "Yes" : "No",
      (a.tags || []).map((t) => t.name).join("; "),
    ];
    lines.push(row.map(escapeCsv).join(","));
  }
  return lines.join("\n");
}

function downloadCsv(csvString, filename) {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

import "./ApplicationTablePage.css";

import TableFilterForm from "../TableFilterForm/TableFilterForm";
import ActiveFilters from "../ActiveFilters/ActiveFilters";
import ApplicationTable from "../ApplicationTable/ApplicationTable";
import EditApplication from "../../EditApplication/EditApplication";

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
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-sourced state
  const [filters, setFilters] = useState(() => readFiltersFromUrl(searchParams));
  const [page, setPage] = useState(() => Number(searchParams.get("page") || 1));
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get("itemsPerPage") || 10));
  const [sortBy, setSortBy] = useState(() => searchParams.get("sortBy") || "dateApplied");
  const [sortDir, setSortDir] = useState(() => searchParams.get("sortDir") || "desc");

  // UI state
  const [editAppId, setEditAppId] = useState(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // reset to page 1 when the query shape changes
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [JSON.stringify(filters), sortBy, sortDir, pageSize]);

  // ---- React Query: fetch current "window" ----
  const queryParams = {
    ...filters,
    sortBy,
    sortDir,
    itemsPerPage: pageSize,
    // the API already accepts page; but we fetch by "window" (5 pages at once)
    // so send window info if your backend supports it; otherwise just send page
    page, // keep sending page for server filtering/sorting consistency
    windowIndex,
    windowSize,
  };

  const {
    data: windowData,
    isLoading: loading,
  } = useQuery({
    queryKey: ["applications", queryParams], // include params so caches are distinct
    queryFn: async () => {
      const res = await API.get("/applications", {
        params: { ...filters, sortBy, sortDir, itemsPerPage: pageSize, page },
        paramsSerializer: p => qs.stringify(p, { arrayFormat: "repeat" }),
      });
      return {
        items: res.data.items ?? [],
        total: res.data.total ?? 0,
        take: res.data.window?.take ?? windowSize,
        skip: res.data.window?.skip ?? windowIndex * windowSize,
      };
    },
    keepPreviousData: true,
    staleTime: 30_000,
  });

  // derive current page rows from window
  const idxInWindow = (page - 1) % 5;
  const start = idxInWindow * pageSize;
  const rows = (windowData?.items ?? []).slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil((windowData?.total ?? 0) / pageSize));

  // sorting handler
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

  // ---- React Query: bulk mutations + invalidation ----
  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, newStatus }) => {
      return API.patch(
        "/applications/statusUpdate",
        { applicationIds: ids, update: { status: newStatus } },
        { withCredentials: true },
      );
    },
    onSuccess: () => {
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["applications", "stats"] }); // if your dashboard uses this
    },
    onError: () => alert("Bulk update failed."),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      // If you have a bulk endpoint, use that; otherwise do fan-out deletes:
      await Promise.all(ids.map((id) => API.delete(`/applications/${id}`, { withCredentials: true })));
    },
    onSuccess: () => {
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["applications", "stats"] });
    },
    onError: () => alert("Bulk delete failed."),
  });

  const updateSelectedApplicationStatus = async (newStatus) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    if (!window.confirm(`Update ${ids.length} applications to '${newStatus}'?`)) return;
    await bulkStatusMutation.mutateAsync({ ids, newStatus });
  };

  const bulkDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} applications?`)) return;
    await bulkDeleteMutation.mutateAsync(ids);
  };

  // ── Export handler ─────────────────────────────────────────
  const handleExport = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    let appsToExport;

    if (selectedIds.size > 0) {
      // Export only selected rows (from the already-fetched window data)
      const allItems = windowData?.items ?? [];
      appsToExport = allItems.filter((a) => selectedIds.has(a.id));
    } else {
      // Export all applications, then client-side filter to match current filters
      try {
        const res = await API.get("/applications/all");
        let all = res.data ?? [];

        // Apply client-side filters to match what the table shows
        const f = filters;
        if (f.statuses?.length) all = all.filter((a) => f.statuses.includes(a.status));
        if (f.modes?.length) all = all.filter((a) => f.modes.includes(a.mode));
        if (f.dateFrom) all = all.filter((a) => a.dateApplied && a.dateApplied.split("T")[0] >= f.dateFrom);
        if (f.dateTo) all = all.filter((a) => a.dateApplied && a.dateApplied.split("T")[0] <= f.dateTo);
        if (f.salaryMin) all = all.filter((a) => (a.effectiveSalary ?? 0) >= Number(f.salaryMin));
        if (f.salaryMax) all = all.filter((a) => (a.effectiveSalary ?? Infinity) <= Number(f.salaryMax));
        if (f.tagNames?.length) {
          all = all.filter((a) => {
            const appTags = (a.tags || []).map((t) => t.name);
            return f.tagNames.some((tn) => appTags.includes(tn));
          });
        }
        if (f.q) {
          const q = f.q.toLowerCase();
          all = all.filter((a) =>
            (a.company || "").toLowerCase().includes(q) ||
            (a.position || "").toLowerCase().includes(q) ||
            (a.source || "").toLowerCase().includes(q) ||
            (a.notes || "").toLowerCase().includes(q)
          );
        }

        appsToExport = all;
      } catch (err) {
        console.error("Export fetch failed:", err);
        alert("Failed to fetch applications for export.");
        return;
      }
    }

    if (!appsToExport.length) {
      alert("No applications to export.");
      return;
    }

    const csv = applicationsToCsv(appsToExport);
    const filename = selectedIds.size > 0
      ? `applications_selected_${today}.csv`
      : `applications_${today}.csv`;
    downloadCsv(csv, filename);
  }, [selectedIds, windowData, filters, sortBy, sortDir]);

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
        onExport={handleExport}
      />

      <ActiveFilters filters={filters} onChange={setFilters} />

      <ApplicationTable
        loading={loading}
        rows={rows}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={onSort}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        selectedIds={selectedIds}
        allOnPageSelected={allOnPageSelected}
        someOnPageSelected={someOnPageSelected}
        onToggleRow={onToggleRow}
        onToggleAllOnPage={onToggleAllOnPage}
        onEdit={setEditAppId}
        onDelete={async (id) => {
          if (!window.confirm("Delete this application?")) return;
          await bulkDeleteMutation.mutateAsync([id]);
        }}
      />

      {editAppId && (
        <div className="modal">
          <EditApplication
            applicationId={editAppId}
            onSuccess={() => {
              setEditAppId(null);
              qc.invalidateQueries({ queryKey: ["applications"] });
            }}
            onClose={() => setEditAppId(null)}
          />
        </div>
      )}
    </div>
  );
}
