import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";
import ResetPasswordForm from "../ResetPasswordForm/ResetPasswordForm";

const LoginForm = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState(null);
  const [showReset, setShowReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  if (showReset) {
    return <ResetPasswordForm onBack={() => setShowReset(false)} />;
  }

  return (
    <form className="guest-form-container" onSubmit={handleSubmit}>
      <h2>Welcome Back</h2>
      <div className="input-wrapper">
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        required
      />
      <div className="password-wrapper">
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="toggle-password"
          >
            {showPassword ? "HIDE" : "SHOW"}
        </button>
      </div></div>
      <div className="forgotPassword">
      <button
        type="button"
        onClick={() => setShowReset(true)}
      >
        Forgot your password?
      </button></div>
      <button type="submit">Log In</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default LoginForm;