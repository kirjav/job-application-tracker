import { useState } from "react";
import API from "../../utils/api";

const ResetPasswordForm = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await API.post("/auth/request-password-reset", { email });
      setMessage("If this email exists, a reset link has been sent.");
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Request failed.";
      console.error("Reset error:", errorMsg);
      setMessage(errorMsg);
    }
  };

  return (
    <form onSubmit={handleReset}>
      <h2>Reset Password</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        required
      />
      <button type="submit">Send Reset Link</button>
      <button
        type="button"
        onClick={onBack}
        style={{ marginTop: "0.5rem" }}
      >
        Back to Login
      </button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default ResetPasswordForm;
