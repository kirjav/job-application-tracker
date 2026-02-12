import { useState } from "react";
import StatusBoard from "../components/StatusDnD/StatusBoard/StatusBoard"
import useTokenMonitor from "../hooks/useTokenMonitor";
import ActionsIconGear from "../assets/icons/table/ActionsIconGear.svg?react";
import NavExpandIcon from "../assets/icons/nav/NavExpandIcon.svg?react";
import NavCollapseIcon from "../assets/icons/nav/NavCollapseIcon.svg?react";
import "./Dashboard.css";

const ACTIVITY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const Dashboard = () => {
  useTokenMonitor();
  const [expandedView, setExpandedView] = useState(true);
  const [activityFilter, setActivityFilter] = useState("all");

  return (
    <div className="dashboard-page">
      <div className="dashboard-inner">
        <div className="dashboard-header">
          <h1 className="dashboard-title">My Applications</h1>
          <div className="dashboard-header-controls">
            <div className="dashboard-activity-filter" role="group" aria-label="Filter by activity">
              {ACTIVITY_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`dashboard-activity-btn ${activityFilter === value ? "is-active" : ""}`}
                  onClick={() => setActivityFilter(value)}
                  aria-pressed={activityFilter === value}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="dashboard-header-actions">
              <button
                type="button"
                className="dashboard-view-toggle"
                onClick={() => setExpandedView((prev) => !prev)}
                aria-pressed={expandedView}
                aria-label={expandedView ? "Show compact cards" : "Show expanded cards"}
                title={expandedView ? "Switch to compact cards" : "Switch to expanded cards"}
              >
                {expandedView ? (
                  <NavCollapseIcon className="dashboard-view-toggle-icon" aria-hidden="true" />
                ) : (
                  <NavExpandIcon className="dashboard-view-toggle-icon" aria-hidden="true" />
                )}
              </button>
              <button className="dashboard-settings" aria-label="Settings">
                <ActionsIconGear />
              </button>
            </div>
          </div>
        </div>
        <StatusBoard expandedView={expandedView} activityFilter={activityFilter} />
      </div>
    </div>
  );
};

export default Dashboard;