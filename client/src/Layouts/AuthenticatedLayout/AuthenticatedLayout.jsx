import useTokenMonitor from "../../hooks/useTokenMonitor";
import SessionWarningModal from "../../components/SessionWarningModal/SessionWarningModal";
import AddApplication from "../../components/CoreJobAppFeatures/AddApplication/AddApplication"
import TopNav from "../../components/Navigation/TopNav/TopNav";
import SideNav from "../../components/Navigation/SideNav/SideNav";

import { Outlet } from "react-router-dom"; // for nested routes
import { useState } from "react";
import "./AuthenticatedLayout.css";

const AuthenticatedLayout = () => {
  const {
    showWarning,
    onStayLoggedIn,
    onLogout,
  } = useTokenMonitor();

   const [forceWarning, setForceWarning] = useState(false);

  const [showAddApplication, setShowAddApplicationPopUp] = useState(false);

  return (
    <div className="auth-layout">
      <div className="side-nav"><SideNav /></div>
      <div className="main-page">
        <div className="top-nav"><TopNav onAddApplicationClick={() => setShowAddApplicationPopUp(true)} /></div>
        {/* Page content */}
        <Outlet />

        {/* showAddApplication Pop Up} */}
        {showAddApplication && (
          <AddApplication onClose={() => setShowAddApplicationPopUp(false)} />
        )}</div>

      {/* Session timeout modal */}
      {showWarning && (
        <SessionWarningModal
          onStayLoggedIn={onStayLoggedIn}
          onLogout={onLogout}
        />
      )}

    </div>
  );
};

export default AuthenticatedLayout;