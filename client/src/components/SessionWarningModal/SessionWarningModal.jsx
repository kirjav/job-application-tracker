import React, { useEffect, useRef } from "react";
import "./SessionWarningModal.css";

const SessionWarningModal = ({ onStayLoggedIn, onLogout }) => {
  const stayRef = useRef(null);

  useEffect(() => {
    // focus the primary action when the modal appears
    stayRef.current?.focus();
  }, []);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-warning-title"
    >
      <div className="modal-content">
        <h3 id="session-warning-title">Session Expiring Soon</h3>
        <p>Your session is about to expire. Would you like to stay logged in?</p>
        <div style={{ marginTop: "1rem" }}>
          <button ref={stayRef} onClick={onStayLoggedIn}>Stay Logged In</button>
          <button onClick={onLogout} style={{ marginLeft: "1rem" }}>Log Out</button>
        </div>
      </div>
    </div>
  );
};

export default SessionWarningModal;
