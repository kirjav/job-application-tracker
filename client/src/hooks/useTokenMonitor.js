import { useEffect, useRef, useState } from "react";
import API from "../utils/api";
import { parseJwt, isTokenExpiringSoon } from "../utils/authHelpers";
import { useNavigate } from "react-router-dom";

const useTokenMonitor = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [hasRefreshed, setHasRefreshed] = useState(false);
  const intervalRef = useRef(null);
  const navigate = useNavigate();

  const refreshToken = async () => {
    try {
      const res = await API.get("/auth/refresh", { withCredentials: true });
      const newToken = res.data.token;
      if (newToken) {
        localStorage.setItem("token", newToken);
        setHasRefreshed(true);
        setShowWarning(false);
      }
    } catch (err) {
      console.error("Token refresh failed", err);
      localStorage.removeItem("token");
      navigate("/");
    }
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem("token");
      if (!token || hasRefreshed) return;

      const decoded = parseJwt(token);
      if (!decoded) return;

      if (isTokenExpiringSoon(decoded)) {
        setShowWarning(true);
      }
    };

    intervalRef.current = setInterval(checkToken, 30000); // every 30 seconds

    return () => clearInterval(intervalRef.current);
  }, [navigate, hasRefreshed]);

  return {
    showWarning,
    onStayLoggedIn: refreshToken,
    onLogout: logoutUser,
  };
};

export default useTokenMonitor;
