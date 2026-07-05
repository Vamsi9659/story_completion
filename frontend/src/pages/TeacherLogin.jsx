
import "./teacher.css";   // use your existing teacher.css
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/auth.css";
import Navbar from "../components/Navbar";

export default function TeacherLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, []);

  const login = async () => {
    const res = await fetch("http://127.0.0.1:8000/teacher/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (res.ok) {
      const data = await res.json();

      // 🔹 CHANGED: localStorage key
      localStorage.setItem("teacher", JSON.stringify(data));

      // 🔹 CHANGED: redirect
      nav("/teacher/home");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <>
      {/* ✅ NAVBAR */}
      <Navbar />

      <div className="auth-page">
        <div className="auth-card">
          <h2>Sign In</h2>
          <p className="auth-subtitle">
            Enter your credentials to continue
          </p>

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={login}>Sign In</button>

          <div className="auth-footer">
            Don’t have an account?{" "}
            <Link to="/teacher/signup">Create one</Link>
          </div>
        </div>
      </div>
    </>
  );
}

