import { useState } from "react";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin((prev) => !prev);
  };

  return (
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
    </div>
  );
};

export default Auth;
