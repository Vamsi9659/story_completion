 import { BrowserRouter, Routes, Route } from "react-router-dom";

 import Welcome from "./pages/welcome";

 // STUDENT
 import StudentLogin from "./pages/StudentLogin";
 import StudentSignup from "./pages/StudentSignup";
 import StudentDashboard from "./pages/StudentDashboard";

 // TEACHER
 import TeacherLogin from "./pages/TeacherLogin";
 import TeacherSignup from "./pages/TeacherSignup";
 import TeacherDashboard from "./pages/TeacherDashboard";

 export default function App() {
   return (
     <BrowserRouter>
       <Routes>

         {/* WELCOME */}
         <Route path="/" element={<Welcome />} />

         {/* STUDENT ROUTES */}
         <Route path="/student/login" element={<StudentLogin />} />
         <Route path="/student/signup" element={<StudentSignup />} />
         <Route path="/student/home" element={<StudentDashboard />} />

         {/* TEACHER ROUTES */}
         <Route path="/teacher/login" element={<TeacherLogin />} />
         <Route path="/teacher/signup" element={<TeacherSignup />} />
         <Route path="/teacher/home" element={<TeacherDashboard />} />

       </Routes>
     </BrowserRouter>
   );
 }


