import { useState } from "react";
import StatusBoard from "../components/StatusDnD/StatusBoard/StatusBoard"
import useTokenMonitor from "../hooks/useTokenMonitor";
import ActionsIconGear from "../assets/icons/table/ActionsIconGear.svg?react";
import NavExpandIcon from "../assets/icons/nav/NavExpandIcon.svg?react";
import NavCollapseIcon from "../assets/icons/nav/NavCollapseIcon.svg?react";
import "./Dashboard.css";

const Dashboard = () => {
  useTokenMonitor();
  const [expandedView, setExpandedView] = useState(true);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">My Applications</h1>
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
              <NavCollapseIcon className="dashboard-view-toggle-icon" aria-hidden />
            ) : (
              <NavExpandIcon className="dashboard-view-toggle-icon" aria-hidden />
            )}
          </button>
          <button className="dashboard-settings" aria-label="Settings">
            <ActionsIconGear />
          </button>
        </div>
      </div>
      <StatusBoard expandedView={expandedView} />
    </div>
  );
};

export default Dashboard;