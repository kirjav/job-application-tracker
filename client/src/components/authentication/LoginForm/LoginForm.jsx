import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../utils/api";
import RequestResetPasswordForm from "../RequestResetPasswordForm/RequestResetPasswordForm";

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
      let errorMsg = "Login failed.";

      if (err.response) {
        // Server responded
        const status = err.response.status;

        if (status === 401) {
          errorMsg = "Invalid email or password.";
        } else if (status === 429) {
          errorMsg = "Too many login attempts. Please try again later.";
        } else if (status >= 500) {
          errorMsg = "Server error. Please try again shortly.";
        } else {
          errorMsg = "Login failed. Please try again.";
        }

      } else if (err.request) {
        // Request made but no response
        errorMsg = "Unable to connect to the server. Check your connection.";
      }

      console.error("Login error:", err);
      setMessage(errorMsg);
    }
  };

  if (showReset) {
    return <RequestResetPasswordForm onBack={() => setShowReset(false)} />;
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
          aria-label="Email"
          autoComplete="email"
          required
        />
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            aria-label="Password"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="toggle-password"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <img
              src={showPassword ? "/icons/auth/eyeHIDE.svg" : "/icons/auth/eyeSHOW.svg"}
              alt=""
              aria-hidden="true"
            />
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
      {message && <p role="alert">{message}</p>}
    </form>
  );
};

export default LoginForm;