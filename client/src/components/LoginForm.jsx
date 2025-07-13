import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

const LoginForm = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await API.post("/auth/login", formData, { withCredentials: true });

      const token = res.data.token;
      if (token) {
        localStorage.setItem("token", token);
        navigate("/dashboard");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Login failed.";
      console.error("Login error:", errorMsg);
      setMessage(errorMsg);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        required
      />
      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default LoginForm;
