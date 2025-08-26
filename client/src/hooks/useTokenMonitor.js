import { useEffect, useRef, useState } from "react";
import API from "../utils/api";
import { parseJwt, isTokenExpiringSoon } from "../utils/authHelpers";
import { useNavigate } from "react-router-dom";

const POLL_MS = 15000;

const useTokenMonitor = () => {
  const [showWarning, setShowWarning] = useState(false);
  const intervalRef = useRef(null);
  const loggingOutRef = useRef(false); // prevent multiple logouts
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    try {
      await API.post("/auth/logout");
    } catch (err) {
      console.warn("Logout failed or already logged out", err);
    } finally {
      localStorage.removeItem("token");
      setShowWarning(false);
      // stop polling before navigating
      if (intervalRef.current) clearInterval(intervalRef.current);
      navigate("/", { replace: true });
    }
  };

  const checkToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      // no token = ensure logged-out state + redirect
      handleLogout();
      return;
    }

    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) {
      // malformed token, treat as logged out
      handleLogout();
      return;
    }

    const nowMs = Date.now();
    const expMs = decoded.exp * 1000;

    if (expMs <= nowMs) {
      // already expired -> logout immediately
      handleLogout();
      return;
    }

    // not expired yet; show warning only if within your threshold
    setShowWarning(isTokenExpiringSoon(decoded));
  };

  const refreshToken = async () => {
    try {
      const res = await API.post("/auth/refresh"); // cookie-based refresh
      const newToken = res?.data?.token;
      if (newToken) localStorage.setItem("token", newToken);
      setShowWarning(false);
      checkToken(); // re-evaluate with new expiry
    } catch (err) {
      console.error("Token refresh failed", err);
      localStorage.removeItem("token");
      setShowWarning(false);
      // stop polling before navigating
      if (intervalRef.current) clearInterval(intervalRef.current);
      navigate("/", { replace: true });
    }
  };

  useEffect(() => {
    checkToken(); // check immediately
    intervalRef.current = setInterval(checkToken, POLL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    showWarning,
    onStayLoggedIn: refreshToken,
    onLogout: handleLogout,
  };
};

export default useTokenMonitor;


