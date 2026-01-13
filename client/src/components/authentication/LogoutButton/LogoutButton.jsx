
import { useNavigate } from "react-router-dom";
import API from "../../../utils/api";
import "./LogoutButton.css";

import LogOutIcon from "../../../assets/icons/nav/logout_icon.svg?react";

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (err) {
      console.warn("Logout failed or already logged out", err);
    } finally {
      localStorage.removeItem("token");
      navigate("/", { replace: true });
    }
  };

  return <button onClick={handleLogout} aria-label="Log out" className="logout-button"><LogOutIcon aria-hidden="true" focusable="false" /></button>;
};

export default LogoutButton;