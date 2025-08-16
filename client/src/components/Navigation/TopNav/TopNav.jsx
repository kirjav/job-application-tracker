import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import LogoutButton from "../../LogoutButton/LogoutButton";
import "./TopNav.css";

const TopNav = ({ onAddApplicationClick}) => {
    return (
        <div className="top-nav">
            <button onClick={onAddApplicationClick} className="application-button">Add Application</button>
            <LogoutButton/>
            <div className="account-icon">A</div>
        </div>
    )
};

export default TopNav;

