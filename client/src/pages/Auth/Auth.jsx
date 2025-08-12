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
      <div className="guest-container">
        <div className="left-side">x</div>
        <div className="right-side">
        <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
          {isLogin ? <LoginForm /> : <RegisterForm />}

          <p>
            {isLogin ? "Don't have an account yet?" : "Already have an account?"}{" "}
            <button
              onClick={toggleForm}>
              {isLogin ? "Sign up for free" : "Login"}
            </button>
          </p>
        </div></div></div></div>

  );
};

export default Auth;
