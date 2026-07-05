import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/auth.css";
import Navbar from "../components/Navbar";

export default function TeacherSignup() {
  const [name, setName] = useState("");
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

  const signup = async () => {
    const res = await fetch("http://127.0.0.1:8000/teacher/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    if (res.ok) {
      alert("Teacher registered successfully");

      // 🔹 CHANGED: redirect after signup
      nav("/teacher/login");
    } else {
      alert("Signup failed");
    }
  };

  return (
    <>
      {/* ✅ NAVBAR */}
      <Navbar />

      <div className="auth-page">
        <div className="auth-card">
          <h2>Sign Up</h2>

          <input
            placeholder="Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

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

          <button onClick={signup}>Sign Up</button>

          <div className="auth-footer">
            Already signed up?{" "}
            {/* 🔹 CHANGED: login link */}
            <Link to="/teacher/login">Login</Link>
          </div>
        </div>
      </div>
    </>
  );
}
