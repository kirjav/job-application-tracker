import useTokenMonitor from "../hooks/useTokenMonitor";
import SessionWarningModal from "../components/SessionWarningModal/SessionWarningModal";
import LogoutButton from "../components/LogoutButton";
import { Outlet } from "react-router-dom"; // for nested routes

const AuthenticatedLayout = () => {
  const {
    showWarningModal,
    timeRemaining,
    renewToken,
    logoutUser,
  } = useTokenMonitor();

  return (
    <>
      {/* Optional global layout elements here */}
      <LogoutButton />

      {/* Page content */}
      <Outlet />

      {/* Session timeout modal */}
      {showWarningModal && (
        <SessionWarningModal
          timeRemaining={timeRemaining}
          onRenew={renewToken}
          onLogout={logoutUser}
        />
      )}
    </>
  );
};

export default AuthenticatedLayout;