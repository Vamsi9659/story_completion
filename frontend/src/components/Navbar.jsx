import { Link, useNavigate, useLocation } from "react-router-dom";
import "./navbar.css";

export default function Navbar() {
  const nav = useNavigate();
  const { pathname } = useLocation();

  const logout = () => {
    localStorage.clear();
    nav("/");
  };

  return (
    <nav className="navbar">
      <h2
        className={`logo ${pathname === "/" ? "active" : ""}`}
        onClick={() => nav("/")}
        role="link"
        tabIndex={0}
      >
        StoryMind
      </h2>

      <div className="nav-links">
        <Link to="/" className={pathname === "/" ? "active" : ""}>
          Home
        </Link>

        <Link
          to="/student/login"
          className={pathname.startsWith("/student") ? "active" : ""}
        >
          Student
        </Link>

        <Link
          to="/teacher/login"
          className={pathname.startsWith("/teacher") ? "active" : ""}
        >
          Teacher
        </Link>
      </div>
    </nav>
  );
} 
