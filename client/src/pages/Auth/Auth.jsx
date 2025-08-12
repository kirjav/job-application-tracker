import { useState } from "react";
import "./Auth.css";
import LoginForm from "../../components/LoginForm/LoginForm";
import RegisterForm from "../../components/RegisterForm/RegisterForm";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin((prev) => !prev);
  };

  return (
    <div className="guest-page">
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
      {isLogin ? <LoginForm /> : <RegisterForm />}

      <p style={{ marginTop: "1rem" }}>
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          onClick={toggleForm}
          style={{
            textDecoration: "underline",
            background: "none",
            border: "none",
            color: "blue",
            cursor: "pointer"
          }}
        >
          {isLogin ? "Register here" : "Login here"}
        </button>
      </p>
    </div></div>
    
  );
};

export default Auth;
