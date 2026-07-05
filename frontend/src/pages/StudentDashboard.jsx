import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import "./studentDashboard.css";

export default function StudentDashboard() {
  const [prompt, setPrompt] = useState("");
  const [story, setStory] = useState("");

  const student = JSON.parse(localStorage.getItem("student"));
  const studentEmail = student?.email;
  const studentName = student?.name;

  // ✅ Load story prompt
  useEffect(() => {
    fetch("http://127.0.0.1:8000/story/prompt")
      .then(res => res.json())
      .then(data => setPrompt(data.prompt));
  }, []);

  // Disable body scroll while dashboard is mounted
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, []);

  // ✅ Submit story
  const submitStory = async () => {
    if (!story.trim()) {
      alert("Please write the story");
      return;
    }

    if (!studentEmail || !studentName) {
      alert("Please login again");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/story/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_name: studentName,
          student_email: studentEmail,
          content: story
        })
      });

      if (!res.ok) {
        alert("Submit failed");
        return;
      }

      alert("✅ Story submitted");
      setStory("");
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <>
      <Navbar />

      <div className="student-bg">
        <h2>👦 Welcome, {studentName}</h2>

        <p><b>Read and complete:</b></p>
        <p style={{ fontStyle: "italic" }}>{prompt}</p>

        <textarea
          placeholder="Continue the story..."
          value={story}
          onChange={(e) => setStory(e.target.value)}
        />

        <button onClick={submitStory}>Submit</button>
      </div>
    </>
  );
}
