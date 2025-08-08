import useTokenMonitor from "../hooks/useTokenMonitor";
import SessionWarningModal from "../components/SessionWarningModal/SessionWarningModal";
import AddApplication from "../components/AddApplication/AddApplication"
import TopNav from "../components/Navigation/TopNav/TopNav";
import SideNav from "../components/Navigation/SideNav/SideNav";
import LogoutButton from "../components/LogoutButton";
import { useState, Outlet } from "react-router-dom"; // for nested routes

const AuthenticatedLayout = () => {
  const {
    showWarning,
    onStayLoggedIn,
    onLogout,
  } = useTokenMonitor();

   const [showAddApplication, setShowAddApplicationPopUp] = useState(false);

  return (
    <>
      {/* Optional global layout elements here */}
      <LogoutButton />
      <SideNav />
      <TopNav onAddApplicationClick={() => setShowAddApplicationPopUp(true)} />

      {/* Page content */}
      <Outlet />

      {/* showAddApplication Pop Up} */}
      {showAddApplication && (
        <AddApplication onClose={() => setShowAddApplicationPopUp(false)} />
      )}

      {/* Session timeout modal */}
      {showWarning && (
        <SessionWarningModal
          onRenew={onStayLoggedIn}
          onLogout={onLogout}
        />
      )}

    </>
  );
};

export default AuthenticatedLayout;