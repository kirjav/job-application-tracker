import { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
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
                    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                        <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                </button></h2>
                <div className="intermission"><div className="decor-line"></div>{!collapsed && (<p>OVERVIEW</p>)}</div>
                <nav>
                    <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "tab-active" : "tab-inactive")}>Dashboard</NavLink>
                    <NavLink to="/applications" className={({ isActive }) => (isActive ? "tab-active" : "tab-inactive")}>My Applications</NavLink>
                </nav>
        </aside >
    )
};

export default SideNav;