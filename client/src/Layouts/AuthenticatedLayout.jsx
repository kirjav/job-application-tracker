import useTokenMonitor from "../hooks/useTokenMonitor";
import SessionWarningModal from "../components/SessionWarningModal/SessionWarningModal";
import TopNav from "../components/Navigation/TopNav/TopNav";
import SideNav from "../components/Navigation/SideNav/SideNav";
import LogoutButton from "../components/LogoutButton";
import { Outlet } from "react-router-dom"; // for nested routes

const AuthenticatedLayout = () => {
  const {
    showWarning,
    onStayLoggedIn,
    onLogout,
  } = useTokenMonitor();


  return (
    <>
      {/* Optional global layout elements here */}
      <LogoutButton />
      <SideNav />
      <TopNav />

      {/* Page content */}
      <Outlet />

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