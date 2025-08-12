
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (err) {
      console.warn("Logout failed or already logged out", err);
    } finally {
      localStorage.removeItem("token");
      navigate("/", { replace: true });
    }
  };

  return <button onClick={handleLogout}>Log Out</button>;
};

export default LogoutButton;