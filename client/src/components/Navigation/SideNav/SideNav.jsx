import { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";

{/** Nav Icon SVGs */}
import NavigationNavArrow from "../../../assets/icons/nav/NavigationNavArrow.svg?react";
import DashboardNavIcon from "../../../assets/icons/nav/DashboardNavIcon.svg?react";
import MyApplicationsNavIcon from "../../../assets/icons/nav/MyApplicationsNavIcon.svg?react";
import NavCollapseIcon from "../../../assets/icons/nav/NavCollapseIcon.svg?react";
import NavExpandIcon from "../../../assets/icons/nav/NavExpandIcon.svg?react";


import "./SideNav.css";

const SideNav = () => {
    const [collapsed, setCollapsed] = useState(() => {
        // remember previous choice
        const saved = localStorage.getItem("sidenav-collapsed");
        return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        localStorage.setItem("sidenav-collapsed", JSON.stringify(collapsed));
    }, [collapsed]);

    const toggleCollapsed = () => setCollapsed(v => !v);
    return (
        <aside className={`side-nav-content ${collapsed ? "collapsed" : "expanded"}`}>
                <h2> <img src="/logo.svg" alt="Website Logo" />{!collapsed && ("Pursuit")}
                <button
                    type="button"
                    className="collapse-btn"
                    onClick={toggleCollapsed}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    aria-expanded={!collapsed}
                    title={collapsed ? "Expand" : "Collapse"}>
                    {/* simple chevron */}
                    {collapsed ? <NavExpandIcon/> : <NavCollapseIcon/>}
                </button></h2>
                <div className="intermission"><div className="decor-line"></div>{!collapsed && (<p>OVERVIEW</p>)}</div>
                <nav aria-label="Main navigation">
                    <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "tab-active" : "tab-inactive")}><DashboardNavIcon className="nav-icon" aria-hidden="true" focusable="false" /><span className="nav-label">Dashboard</span></NavLink>
                    <NavLink to="/applications" className={({ isActive }) => (isActive ? "tab-active" : "tab-inactive")}><MyApplicationsNavIcon className="nav-icon" aria-hidden="true" focusable="false" /><span className="nav-label">My Applications</span></NavLink>
                    <NavLink to="/stats" className={({ isActive }) => (isActive ? "tab-active" : "tab-inactive")}>
                        <svg className="nav-icon" width="24" height="24" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="18" y="3" width="4" height="18" rx="1" />
                            <rect x="10" y="8" width="4" height="13" rx="1" />
                            <rect x="2" y="13" width="4" height="8" rx="1" />
                        </svg>
                        <span className="nav-label">Stats</span>
                    </NavLink>
                </nav>
                <div className="side-nav-footer">
                    <a href="https://example.com/feedback" target="_blank" rel="noopener noreferrer" className="side-nav-feedback-link" title="Send Feedback">
                        <svg className="nav-icon" width="24" height="24" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <span className="nav-label">Send Feedback</span>
                    </a>
                    {!collapsed && <span className="side-nav-copyright">&copy; 2026 Pursuit</span>}
                </div>
        </aside >
    )
};

export default SideNav;