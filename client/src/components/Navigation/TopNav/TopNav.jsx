import { useState } from "react";
import LogoutButton from "../../authentication/LogoutButton/LogoutButton";
import UserSettingsModal from "../../UserSettingsModal/UserSettingsModal";
import "./TopNav.css";

import AddApplicationIcon from "../../../assets/icons/addApplicationIcon.svg?react";

const TopNav = ({ onAddApplicationClick }) => {
  const [showUserSettings, setShowUserSettings] = useState(false);

  return (
    <>
      <div className="top-nav">
        <button onClick={onAddApplicationClick} className="application-button">
          <AddApplicationIcon /> Add Application
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

