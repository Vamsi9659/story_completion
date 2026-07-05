import Navbar from "../components/Navbar";
import "./welcome.css";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Welcome() {
  const nav = useNavigate();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, []);

  return (
    <>
      <Navbar />

      <div className="welcome-bg">
        <h1 className="title">
          Welcome to <span>StoryMind</span>
        </h1>

        <div className="role-cards">
          <button className="role-card" type="button" onClick={() => nav("/teacher/login")} aria-label="Teacher login">
            <div className="icon" aria-hidden>👩‍🏫</div>
            <h3>Teacher</h3>
          </button>

          <button className="role-card" type="button" onClick={() => nav("/student/login")} aria-label="Student login">
            <div className="icon" aria-hidden>🎓</div>
            <h3>Student</h3>
          </button>
        </div>
      </div>
    </>
  );
}
