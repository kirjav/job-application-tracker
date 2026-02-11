import { useState, useEffect, useCallback } from "react";
import API from "../utils/api";
import EditApplication from "../components/CoreJobAppFeatures/EditApplication/EditApplication";
import "./ApplicationsMobile.css";

const STATUS_COLORS = {
  Wishlist: "var(--wishlist-status-color)",
  Applied: "var(--applied-status-color)",
  Interviewing: "var(--interviewing-status-color)",
  Offer: "var(--offer-status-color)",
  Rejected: "var(--rejected-status-color)",
  Ghosted: "var(--ghosted-status-color)",
  Withdrawn: "var(--withdrawn-status-color)",
};

function formatDate(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ApplicationsMobile() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await API.get("/applications/all", { params: { activity: "all" } });
      setApplications(res.data ?? []);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleEditSuccess = () => {
    setEditId(null);
    fetchApplications();
  };

  return (
    <div className="applications-mobile-page">
      <header className="applications-mobile-header">
        <h1 className="applications-mobile-title">My Applications</h1>
        <p className="applications-mobile-subtitle">
          Tap an application to edit. Use the Add button above to create one.
        </p>
      </header>

      {loading ? (
        <p className="applications-mobile-loading">Loading…</p>
      ) : applications.length === 0 ? (
        <p className="applications-mobile-empty">No applications yet. Add one using the button above.</p>
      ) : (
        <ul className="applications-mobile-list" aria-label="Application list">
          {applications.map((app) => {
            const statusColor = STATUS_COLORS[app.status] || "var(--decor-line-color)";
            return (
              <li key={app.id}>
                <button
                  type="button"
                  className="applications-mobile-card"
                  onClick={() => setEditId(app.id)}
                  aria-label={`Edit ${app.company} – ${app.position}`}
                >
                  <span className="applications-mobile-card-color-bar" style={{ backgroundColor: statusColor }} aria-hidden />
                  <span className="applications-mobile-card-inner">
                    <span className="applications-mobile-card-company">{app.company}</span>
                    <span className="applications-mobile-card-position">{app.position}</span>
                    <span className="applications-mobile-card-meta">
                      {app.status} · {formatDate(app.dateApplied)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {editId && (
        <EditApplication
          applicationId={editId}
          onSuccess={handleEditSuccess}
          onClose={() => setEditId(null)}
        />
      )}
    </div>
  );
}
