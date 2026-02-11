import { useState, useEffect } from "react";
import LogoutButton from "../../authentication/LogoutButton/LogoutButton";
import UserSettingsModal from "../../UserSettingsModal/UserSettingsModal";
import "./TopNav.css";

import AddApplicationIcon from "../../../assets/icons/addApplicationIcon.svg?react";
import SunIcon from "../../../assets/icons/nav/SunIcon.svg?react";
import MoonIcon from "../../../assets/icons/nav/MoonIcon.svg?react";

const THEME_KEY = "app-theme";

function getInitialTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || "light";
  } catch {
    return "light";
  }
}

const TopNav = ({ onAddApplicationClick }) => {
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <>
      <div className="top-nav">
        <button onClick={onAddApplicationClick} className="application-button">
          <AddApplicationIcon /> Add Application
        </button>
        <button
          type="button"
          className="top-nav-theme-toggle"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Light mode" : "Dark mode"}
        >
          {isDark ? (
            <SunIcon className="top-nav-theme-icon" />
          ) : (
            <MoonIcon className="top-nav-theme-icon" />
          )}
        </button>
        <LogoutButton />
        <button
          type="button"
          className="account-icon"
          onClick={() => setShowUserSettings(true)}
          aria-label="User settings"
          title="User settings"
        >
          A
        </button>
      </div>
      {showUserSettings && (
        <UserSettingsModal onClose={() => setShowUserSettings(false)} />
      )}
    </>
  );
};

export default TopNav;

