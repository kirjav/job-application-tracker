import React from "react";
import "./SessionWarningModal.css";

const SessionWarningModal = ({ onStayLoggedIn, onLogout }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Session Expiring Soon</h3>
        <p>Your session is about to expire. Would you like to stay logged in?</p>
        <div style={{ marginTop: "1rem" }}>
          <button onClick={onStayLoggedIn}>Stay Logged In</button>
          <button onClick={onLogout} style={{ marginLeft: "1rem" }}>Log Out</button>
        </div>
      </div>
    </div>
  );
};

export default SessionWarningModal;
