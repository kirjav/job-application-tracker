import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";

const SideNav = () => {
    return (
        <div>
            <h2>Side Nav</h2>
            <nav>
                <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "tab-active" : "tab-inactive")}>Dashboard</NavLink>
                <NavLink to="/applications" className={({ isActive }) => (isActive ? "tab-active" : "tab-inactive")}>My Applications</NavLink>
            </nav>
        </div>
    )
};

export default SideNav;