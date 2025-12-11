import { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import { StudentSkillsProvider } from './context/StudentSkillsContext';
import Footer from "./components/Footer";
import Navbar from './components/Navbar';
import BusinessPage from './pages/BusinessPage';
import LoginPage from './pages/LoginPage';
import NotFound from './pages/NotFound';
import OverviewPage from './pages/OverviewPage';
import ProfilePage from "./pages/ProfilePage";
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import ProjectsAddPage from './pages/ProjectsAddPage';
import UpdateStudentPage from "./pages/update_student_page/update_student_page";
import UpdateBusinessPage from './pages/UpdateBusinessPage';
import { getAuthorization } from './services';
import TeacherPage from "./pages/TeacherPage";
import EmailNotFound from "./pages/EmailNotFoundPage";
import AuthCallback from "./auth/AuthCallback";
import StudentDashboard from "./pages/StudentDashboard";

export default function App() {
  const { setAuthData } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    let ignore = false;

    getAuthorization()


  }, [location, setAuthData]);

  return (
    <StudentSkillsProvider>
      <div className="min-h-screen bg-neu-bg">
        {location.pathname !== "/" && <Navbar />}
        <main className="max-w-7xl min-h-dvh px-6 mx-auto relative py-6">
          <Routes>
            <Route path="/email-not-found" element={<EmailNotFound />} />
            <Route path="/" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/home" element={<StudentDashboard />} />
            <Route path="/ontdek" element={<OverviewPage />} />
            <Route path="/projects">
              <Route path="add" element={<ProjectsAddPage />} />
              <Route path=":projectId" element={<ProjectDetailsPage />} />
            </Route>
            <Route path="/business">
              <Route path=":businessId" element={<BusinessPage />} />
              <Route path="update" element={<UpdateBusinessPage />} />
            </Route>
            <Route path="/student">
              <Route path=":profileId" element={<ProfilePage />} />
              <Route path="update" element={<UpdateStudentPage />} />
            </Route>
            <Route path="/teacher" element={<TeacherPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {location.pathname !== "/" && <Footer />}
      </div>
    </StudentSkillsProvider>
  )
}


