import { useEffect, useMemo, useState } from "react";
import API from "../../utils/api";
import EditApplication from "../EditApplication/EditApplication";
import TableFilterForm from "../TableFilterForm/TableFilterForm";
import "./ApplicationTable.css";

const ApplicationTable = () => {
  // ---- local state (no filters prop) ----
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [sortBy, setSortBy] = useState("dateApplied");
  const [sortDir, setSortDir] = useState("desc");

  const [windowData, setWindowData] = useState({ items: [], total: 0, take: 0, skip: 0 });
  const [loading, setLoading] = useState(false);
  const [editAppId, setEditAppId] = useState(null);

  const windowIndex = useMemo(() => Math.floor((page - 1) / 5), [page]);
  const windowSize  = 5 * pageSize;

  // Reset to page 1 when filters/sort/pageSize change
  useEffect(() => { setPage(1); }, [JSON.stringify(filters), sortBy, sortDir, pageSize]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await API.get("/applications", {
        params: {
          ...filters,
          sortBy, sortDir,
          itemsPerPage: pageSize,
          page,
        },
      });
      setWindowData({
        items: res.data.items ?? [],
        total: res.data.total ?? 0,
        take : res.data.window?.take ?? windowSize,
        skip : res.data.window?.skip ?? windowIndex * windowSize,
      });
    } catch (err) {
      console.error("Failed to fetch applications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), sortBy, sortDir, pageSize, windowIndex]);

  const idxInWindow = (page - 1) % 5;
  const start = idxInWindow * pageSize;
  const rows  = windowData.items.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(windowData.total / pageSize));

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
      {/* ✅ Render filter form INSIDE and wire it */}
      <TableFilterForm value={filters} onSubmit={setFilters} />

      <div className="table-topbar">
        <h2>Applications</h2>
        <label style={{ marginLeft: "auto" }}>
          Rows:
          <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
            {[10,20,30,50].map(n => <option key={n} value={n}>{n}</option>)}
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
              <th aria-sort={ariaSort("company")}><button type="button" className="th-sort" onClick={()=>toggleSort("company")}>Company{caret("company")}</button></th>
              <th aria-sort={ariaSort("position")}><button type="button" className="th-sort" onClick={()=>toggleSort("position")}>Position{caret("position")}</button></th>
              <th aria-sort={ariaSort("status")}><button type="button" className="th-sort" onClick={()=>toggleSort("status")}>Status{caret("status")}</button></th>
              <th aria-sort={ariaSort("mode")}><button type="button" className="th-sort" onClick={()=>toggleSort("mode")}>Mode{caret("mode")}</button></th>
              <th aria-sort={ariaSort("dateApplied")}><button type="button" className="th-sort" onClick={()=>toggleSort("dateApplied")}>Date Applied{caret("dateApplied")}</button></th>
              <th aria-sort={ariaSort("salary")}><button type="button" className="th-sort" onClick={()=>toggleSort("salary")}>Salary{caret("salary")}</button></th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(app => (
              <tr key={app.id}>
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
                <td>
                  <button onClick={() => setEditAppId(app.id)}>Edit</button>
                  <button onClick={() => handleDelete(app.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pager */}
      <div className="pager" style={{ marginTop: "1rem" }}>
        <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}>Previous</button>
        <span style={{ margin: "0 1rem" }}>Page {page} of {totalPages}</span>
        <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}>Next</button>
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
