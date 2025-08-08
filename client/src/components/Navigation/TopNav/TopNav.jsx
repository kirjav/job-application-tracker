import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";

const TopNav = ({ onAddApplicationClick}) => {
    return (
        <div>
            <h2>Top Nav</h2>
            <button onClick={onAddApplicationClick} className="application-button">Add Application</button>
        </div>
    )
};

export default TopNav;

