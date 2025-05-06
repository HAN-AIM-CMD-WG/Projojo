import { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './components/AuthProvider';
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

export default function App() {
  const { setAuthData } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    getAuthorization()
      .then(data => {
        if (ignore) return;

        if (data.type === "none" && location.pathname !== "/") {
          navigate("/");
          return
        }

        if (data.type === "invalid" && location.pathname !== "/email-not-found") {
          navigate("/email-not-found");
          return;
        }

        data.isLoading = false
        setAuthData(data)
      })
      .catch(() => {
        if (!ignore && location.pathname !== "/") {
          navigate("/")
        }
      })

    return () => {
      ignore = true;
    }
  }, [location, setAuthData]);

  return (
    <>
      {location.pathname !== "/" && <Navbar />}
      <div className="max-w-7xl min-h-dvh px-4 mx-auto relative">
        <Routes>
          <Route path="/email-not-found" element={<EmailNotFound />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="/home" element={<OverviewPage />} />
          <Route path="/projects">
            <Route path="add" element={<ProjectsAddPage />} />
            <Route path=":projectId" element={<ProjectDetailsPage />} />
          </Route>
          <Route path="/business">
            <Route path=":businessId" element={<BusinessPage />} />
            <Route path="update" element={<UpdateBusinessPage />} />
          </Route>
          <Route path="/profile">
            <Route path=":profileId" element={<ProfilePage />} />
            <Route path="update" element={<UpdateStudentPage />} />
          </Route>
          <Route path="/teacher" element={<TeacherPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {location.pathname !== "/" && <Footer />}
    </>
  )
}