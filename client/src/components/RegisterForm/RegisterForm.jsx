import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

    const passwordsMatch = useMemo(() => {
    return (
      formData.password.length > 0 &&
      formData.confirmPassword.length > 0 &&
      formData.password === formData.confirmPassword
    );
  }, [formData.password, formData.confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

        // Only send the real password (omit confirmPassword)
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
    };

    try {
      const res = await API.post("/auth/register", payload, { withCredentials: true });

      const token = res.data.token;
      if (token) {
        localStorage.setItem("token", token);
        navigate("/dashboard");
      }

      setMessage("Registration successful!");
      console.log("User registered:", res.data);

    } catch (err) {
      const errorMsg = err.response?.data?.error || "Registration failed.";
      console.error("Registration error:", errorMsg);
      setMessage(errorMsg);
    }
  };

  return (
    <form className="guest-form-container" onSubmit={handleSubmit}>
      <h2>Create Account</h2>
      <div className="input-wrapper">
      <input
        type="name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Name"
        required
      />
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        required
      />
      {/* Password */}
      <div className="password-wrapper">
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          required
          aria-invalid={!passwordsMatch && formData.confirmPassword !== ""}
          aria-describedby="pwd-help"
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="toggle-password"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? "HIDE" : "SHOW"}
        </button>
      </div>
      {/* Confirm Password */}
      <div className="password-wrapper">
        <input
          type={showConfirmPassword ? "text" : "password"}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm Password"
          aria-invalid={!passwordsMatch && formData.confirmPassword !== ""}
          required
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword((prev) => !prev)}
          className="toggle-password"
          aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
        >
          {showConfirmPassword ? "HIDE" : "SHOW"}
        </button>
      </div>

      {!passwordsMatch && formData.confirmPassword !== "" && (
        <p id="pwd-help" role="alert" style={{ fontSize: 12 }}>
          Passwords don’t match.
        </p>
      )}

      <button type="submit">Register</button></div>

      {message && <p>{message}</p>}
    </form>
  );
};

export default RegisterForm;
