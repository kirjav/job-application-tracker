import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

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
      const res = await API.post("/auth/register", formData, { withCredentials: true });

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
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
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
      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Password"
        required
      />
      <button type="submit">Register</button>

      {message && <p>{message}</p>}
    </form>
  );
};

export default RegisterForm;
