import { useEffect, useRef } from "react";
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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
import UpdateProjectPage from './pages/UpdateProjectPage';
import { getAuthorization, HttpError } from './services';
import TeacherPage from "./pages/TeacherPage";
import EmailNotFound from "./pages/EmailNotFoundPage";
import AuthCallback from "./auth/AuthCallback";
import UpdateTaskPage from "./pages/UpdateTaskPage";
import { notification } from './components/notifications/NotifySystem.jsx';
import StudentDashboard from "./pages/StudentDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import DesignDemoPage from "./pages/DesignDemoPage";
import PublicDiscoveryPage from "./pages/PublicDiscoveryPage";

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
  const navigate = useNavigate();

  // Disable browser's native scroll restoration - we handle it ourselves
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

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

  // List pages where scroll position should be saved/restored
  const scrollRestorationPaths = ['/ontdek', '/home', '/teacher'];
  
  // Track scroll position continuously for list pages
  const scrollTimeoutRef = useRef(null);
  const mutationObserverRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  
  useEffect(() => {
    const isListPage = scrollRestorationPaths.some(path => 
      location.pathname === path || location.pathname.startsWith(path + '/')
    );
    
    const scrollKey = `scrollPos_${location.pathname}`;
    
    if (isListPage) {
      // Restore scroll position for list pages
      const savedPosition = sessionStorage.getItem(scrollKey);
      if (savedPosition) {
        const targetPosition = parseInt(savedPosition, 10);
        let restored = false;
        const startTime = Date.now();
        const maxDuration = 10000; // Try for up to 10 seconds
        
        // Function to attempt scroll restoration
        const tryRestoreScroll = () => {
          if (restored) return true;
          
          const currentMaxScroll = document.documentElement.scrollHeight - window.innerHeight;
          const elapsed = Date.now() - startTime;
          
          // Stop trying after maxDuration
          if (elapsed > maxDuration) {
            cleanup();
            // Final attempt - scroll to whatever position we can
            if (targetPosition > 0) {
              window.scrollTo(0, Math.min(targetPosition, currentMaxScroll));
            }
            return true;
          }
          
          if (targetPosition <= currentMaxScroll && targetPosition > 0) {
            // Page is tall enough, restore scroll
            window.scrollTo(0, targetPosition);
            
            // Verify scroll was successful (within 50px tolerance)
            requestAnimationFrame(() => {
              if (Math.abs(window.scrollY - targetPosition) < 50) {
                restored = true;
                cleanup();
              }
            });
          }
          
          return restored;
        };
        
        const cleanup = () => {
          if (mutationObserverRef.current) {
            mutationObserverRef.current.disconnect();
            mutationObserverRef.current = null;
          }
          if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
          }
        };
        
        // Use MutationObserver to detect when content is added to the page
        mutationObserverRef.current = new MutationObserver(() => {
          tryRestoreScroll();
        });
        
        // Observe the main content area for changes
        const mainContent = document.getElementById('main-content') || document.body;
        mutationObserverRef.current.observe(mainContent, {
          childList: true,
          subtree: true
        });
        
        // Also poll regularly in case MutationObserver misses something
        scrollIntervalRef.current = setInterval(() => {
          if (tryRestoreScroll()) {
            cleanup();
          }
        }, 200);
        
        // Initial attempts
        tryRestoreScroll();
      }
      
      // Save scroll position on every scroll (debounced)
      const handleScroll = () => {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          sessionStorage.setItem(scrollKey, window.scrollY.toString());
        }, 100);
      };
      
      // Save scroll position immediately when any link is clicked (before navigation)
      const handleLinkClick = (e) => {
        // Only save if we're clicking a link that will navigate away
        const link = e.target.closest('a');
        if (link && link.href && !link.href.startsWith('javascript:')) {
          const currentScrollY = window.scrollY;
          if (currentScrollY > 0) {
            sessionStorage.setItem(scrollKey, currentScrollY.toString());
          }
        }
      };
      
      window.addEventListener('scroll', handleScroll, { passive: true });
      document.addEventListener('click', handleLinkClick, { capture: true });
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('click', handleLinkClick, { capture: true });
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        if (mutationObserverRef.current) {
          mutationObserverRef.current.disconnect();
          mutationObserverRef.current = null;
        }
        if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current);
          scrollIntervalRef.current = null;
        }
      };
    } else {
      // Scroll to top for non-list pages
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  // Pages without navbar/footer (landing, login, auth callback, design demo, public discovery)
  const isPublicPage = location.pathname === "/" || location.pathname === "/login" || location.pathname === "/auth/callback" || location.pathname === "/email-not-found" || location.pathname === "/design-demo" || location.pathname.startsWith("/publiek");

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
              <Route path=":projectId">
              <Route index element={<ProjectDetailsPage />} />
                <Route path="update" element={<UpdateProjectPage />} />
            </Route>
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
            <Route path="/tasks">
            <Route path=":taskId/update" element={<UpdateTaskPage />} />
          </Route>
          <Route path="/teacher" element={<TeacherPage />} />
            <Route path="/design-demo" element={<DesignDemoPage />} />
            <Route path="/publiek" element={<PublicDiscoveryPage />} />
            <Route path="/publiek/:projectId" element={<PublicDiscoveryPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {!isPublicPage && <Footer />}
      </div>
    </StudentSkillsProvider>
    </ThemeProvider>
  )
}
