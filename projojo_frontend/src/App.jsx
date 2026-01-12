import { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
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
import UpdateProjectPage from './pages/UpdateProjectPage';
import { getAuthorization, HttpError } from './services';
import TeacherPage from "./pages/TeacherPage";
import EmailNotFound from "./pages/EmailNotFoundPage";
import AuthCallback from "./auth/AuthCallback";
import UpdateTaskPage from "./pages/UpdateTaskPage";
import { notification } from './components/notifications/NotifySystem.jsx';

export default function App() {
  const { setAuthData } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      if (event.reason instanceof HttpError) {
        notification.error(event.reason.message || "Er is een onbekende fout opgetreden.");
      } else {
        // Log non-HttpError rejections for debugging and show a generic error to the user
        console.error('Unhandled promise rejection:', event.reason);
        notification.error("Er is een onverwachte fout opgetreden.");
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  useEffect(() => {
    getAuthorization()
  }, [location, setAuthData]);

  return (
    <>
      {location.pathname !== "/" && <Navbar />}
      <div className="max-w-7xl min-h-dvh px-4 mx-auto relative">
        <Routes>
          <Route path="/email-not-found" element={<EmailNotFound />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/home" element={<OverviewPage />} />
          <Route path="/projects">
            <Route path="add" element={<ProjectsAddPage />} />
            <Route path=":projectId">
              <Route index element={<ProjectDetailsPage />} />
              <Route path="update" element={<UpdateProjectPage />} />
            </Route>
          </Route>
          <Route path="/business">
            <Route path=":businessId" element={<BusinessPage />} />
            <Route path="update" element={<UpdateBusinessPage />} />
          </Route>
          <Route path="/student">
            <Route path=":profileId" element={<ProfilePage />} />
            <Route path="update" element={<UpdateStudentPage />} />
          </Route>
          <Route path="/tasks">
            <Route path=":taskId/update" element={<UpdateTaskPage />} />
          </Route>
          <Route path="/teacher" element={<TeacherPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {location.pathname !== "/" && <Footer />}
    </>
  )
}
