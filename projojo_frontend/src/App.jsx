import { useEffect } from "react";
import { Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import { StudentSkillsProvider } from './context/StudentSkillsContext';
import { ThemeProvider } from './context/ThemeContext';
import Footer from "./components/Footer";
import Navbar from './components/Navbar';
import BusinessPage from './pages/BusinessPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import NotFound from './pages/NotFound';
import OverviewPage from './pages/OverviewPage';
import ProfilePage from "./pages/ProfilePage";
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import ProjectsAddPage from './pages/ProjectsAddPage';
import UpdateStudentPage from "./pages/update_student_page/update_student_page";
import UpdateBusinessPage from './pages/UpdateBusinessPage';
import { getAuthorization, HttpError } from './services';
import TeacherPage from "./pages/TeacherPage";
import EmailNotFound from "./pages/EmailNotFoundPage";
import AuthCallback from "./auth/AuthCallback";
import StudentDashboard from "./pages/StudentDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import { notification } from './components/notifications/NotifySystem.jsx';

/**
 * HomePage - Conditionally renders StudentDashboard or SupervisorDashboard based on user role
 */
function HomePage() {
  const { authData } = useAuth();
  
  if (authData.type === 'supervisor') {
    return <SupervisorDashboard />;
  }
  
  // Default to StudentDashboard (which also handles non-student fallback)
  return <StudentDashboard />;
}

export default function App() {
  const { setAuthData } = useAuth();
  const location = useLocation();

  // CRITICAL: Global error handling for unhandled promise rejections
  // This catches HttpErrors from API calls and displays them to the user
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

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    getAuthorization();
  }, [location, setAuthData]);

  // Pages without navbar/footer (landing, login, auth callback)
  const isPublicPage = location.pathname === "/" || 
                       location.pathname === "/login" || 
                       location.pathname === "/auth/callback" || 
                       location.pathname === "/email-not-found";

  return (
    <ThemeProvider>
      <StudentSkillsProvider>
        <div className="min-h-screen bg-[var(--neu-bg)] text-[var(--text-primary)] transition-colors duration-300">
          {/* Skip link for keyboard navigation - WCAG 2.4.1 */}
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:font-bold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
          >
            Ga naar hoofdinhoud
          </a>
          
          {!isPublicPage && <Navbar />}
          <main 
            id="main-content" 
            tabIndex="-1"
            className={isPublicPage ? "" : "max-w-7xl min-h-dvh px-6 mx-auto relative py-6 focus:outline-none"}
          >
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/email-not-found" element={<EmailNotFound />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/ontdek" element={<OverviewPage />} />
              <Route path="/projects">
                <Route path="add" element={<ProjectsAddPage />} />
                <Route path=":projectId" element={<ProjectDetailsPage />} />
              </Route>
              <Route path="/business">
                <Route path=":businessId" element={<BusinessPage />} />
                <Route path=":businessId/update" element={<UpdateBusinessPage />} />
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
          {!isPublicPage && <Footer />}
        </div>
      </StudentSkillsProvider>
    </ThemeProvider>
  );
}
