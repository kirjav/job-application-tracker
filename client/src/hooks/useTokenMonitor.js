import { useEffect, useRef, useState } from "react";
import API from "../utils/api";
import { parseJwt, isTokenExpiringSoon } from "../utils/authHelpers";
import { useNavigate } from "react-router-dom";

const POLL_MS = 15000;

const useTokenMonitor = () => {
  const [showWarning, setShowWarning] = useState(false);
  const intervalRef = useRef(null);
  const navigate = useNavigate();

  const checkToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowWarning(false);
      return;
    }
    const decoded = parseJwt(token);
    if (!decoded) {
      setShowWarning(false);
      return;
    }
    setShowWarning(isTokenExpiringSoon(decoded));
  };

  const refreshToken = async () => {
    try {
      const res = await API.post("/auth/refresh"); // withCredentials:true ensures cookie goes
      const newToken = res?.data?.token;           // server returns token in body
      if (newToken) {
        localStorage.setItem("token", newToken);
      }
      setShowWarning(false); // hide immediately on success
      checkToken();          // re-evaluate with the new expiry
    } catch (err) {
      console.error("Token refresh failed", err);
      localStorage.removeItem("token");
      setShowWarning(false);
      navigate("/", { replace: true });
    }
  };

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (err) {
      console.warn("Logout failed or already logged out", err);
    } finally {
      localStorage.removeItem("token");
      setShowWarning(false);
      navigate("/", { replace: true });
    }
  };

  useEffect(() => {
    checkToken(); // don’t wait for first interval
    intervalRef.current = setInterval(checkToken, POLL_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  return {
    showWarning,
    onStayLoggedIn: refreshToken,
    onLogout: handleLogout,
  };
};

export default useTokenMonitor;

