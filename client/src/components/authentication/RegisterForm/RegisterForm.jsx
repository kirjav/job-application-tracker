import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../utils/api";

import PasswordChecklist from "../PasswordChecklist/PasswordChecklist";
import { usePasswordValidation } from "../../../hooks/usePasswordValidation";


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

  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const { checks, isValid: isPasswordValid } = usePasswordValidation(formData.password);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const passwordsMatch = useMemo(() => {
    return formData.password === formData.confirmPassword;
  }, [formData.password, formData.confirmPassword]);

  const showMismatch =
    confirmTouched && formData.confirmPassword.length > 0 && !passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);


    if (!isPasswordValid) {
      setMessage("Password does not meet requirements.");
      return;
    }
    if (!passwordsMatch) {
      setMessage("Passwords do not match.");
      return;
    }

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
          type="text"
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
            onBlur={() => setPasswordTouched(true)}
            placeholder="Password"
            required
            aria-invalid={passwordTouched && !isPasswordValid}
            aria-describedby="pwd-checklist"
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="toggle-password"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <img
              src={showPassword ? "/icons/auth/eyeHIDE.svg" : "/icons/auth/eyeSHOW.svg"}
              alt={showPassword ? "Hide password" : "Show password"}
            />
          </button>
        </div>
        <PasswordChecklist
          checks={checks}
          show={passwordTouched || formData.password.length > 0}
          id="pwd-checklist"
        />

        {/* Confirm Password */}
        <div className="password-wrapper">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={() => setConfirmTouched(true)}
            placeholder="Confirm Password"
            aria-invalid={showMismatch}
            required
          />




          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="toggle-password"
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
          >
            <img
              src={showConfirmPassword ? "/icons/auth/eyeHIDE.svg" : "/icons/auth/eyeSHOW.svg"}
              alt={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            />
          </button>
        </div>
        {showMismatch && (
          <p role="alert" style={{ fontSize: 12 }}>
            Passwords don’t match.
          </p>
        )}
        {/*{!passwordsMatch && formData.confirmPassword !== "" && (
          <p id="pwd-help" role="alert" style={{ fontSize: 12 }}>
            Passwords don’t match.
          </p>
        )}*/}

        <button type="submit">
          Register
        </button>
      </div>

      {message && <p>{message}</p>}
    </form>
  );
};

export default RegisterForm;
