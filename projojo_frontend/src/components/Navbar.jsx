import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { IMAGE_BASE_URL, getUser, getBusinessById } from "../services";
import { useAuth } from "../auth/AuthProvider";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
    const { authData, logout } = useAuth();
    const [profilePicture, setProfilePicture] = useState("/default_profile_picture.png");
    const [businessData, setBusinessData] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const navRef = useRef(null);

    const routes = [];

    if (authData.type !== "invalid" && authData.type !== "none") {
        routes.push({
            name: "Home",
            ref: "/home",
        });
    }

    // Add "Ontdek" for students to find projects
    if (authData.type === "student") {
        routes.push({
            name: "Ontdek",
            ref: "/ontdek",
        });
    }

    if (authData.type === "teacher") {
        routes.push({
            name: "Beheer",
            ref: "/teacher",
        });
    } else if (authData.type === "supervisor") {
        routes.push({
            name: "Mijn organisatie",
            ref: `/business/${authData.businessId}`,
        });
    } else if (authData.type === "student") {
        routes.push({
            name: "Mijn profiel",
            ref: `/student/${authData.userId}`,
        });
    }

    useEffect(() => {
        let ignore = false;

        // Fetch profile picture for all user types
        if (authData.type === "student" || authData.type === "supervisor" || authData.type === "teacher") {
            getUser(authData.userId)
                .then(data => {
                    if (ignore) return;
                    setProfilePicture(`${IMAGE_BASE_URL}${data.image_path}`);
                })
                .catch(() => {
                    // Keep default profile picture
                });
        }
        
        // Fetch business data for supervisor
        if (authData.type === "supervisor" && authData.businessId) {
            getBusinessById(authData.businessId)
                .then(data => {
                    if (ignore) return;
                    setBusinessData(data);
                })
                .catch(() => setBusinessData(null));
        }

        return () => {
            ignore = true;
        }
    }, [authData])

    useEffect(() => {
        setIsCollapsed(true);
    }, [location])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (navRef.current && !navRef.current.contains(event.target)) {
                setIsCollapsed(true);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const signOut = () => {
        logout();
        navigate("/");
    }

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const activeNavLink = "flex items-center gap-2 py-2.5 px-5 text-primary font-bold rounded-2xl transition-all duration-200 md:px-4 md:py-2"
    const inactiveNavLink = "flex items-center gap-2 py-2.5 px-5 text-text-secondary font-semibold rounded-2xl hover:text-primary hover:bg-[var(--gray-200)]/30 transition-all duration-200 md:px-4 md:py-2"

    return (
        <header>
            <nav ref={navRef} className="bg-[var(--neu-bg)] fixed w-full z-40 top-0 start-0 border-b border-[var(--neu-border)]" style={{ boxShadow: '0 4px 20px var(--neu-shadow-dark)' }}>
                <div className="max-w-7xl flex flex-wrap items-center justify-between mx-auto px-6 h-20">
                    {/* Logo */}
                    <Link to="/home" className="flex items-center gap-3 group" aria-label="Projojo - Ga naar home">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-2xl text-primary" aria-hidden="true">school</span>
                        </div>
                        <div>
                            <h1 className="font-extrabold text-lg text-[var(--text-primary)] tracking-tight leading-none group-hover:text-primary transition-colors">
                                Projojo
                            </h1>
                            <p className="text-[10px] text-[var(--text-muted)] font-semibold tracking-widest uppercase mt-0.5">
                                Student Hub
                            </p>
                        </div>
                    </Link>

                    {/* Mobile menu button */}
                    <button 
                        type="button" 
                        onClick={toggleCollapse} 
                        className="neu-icon-btn md:hidden" 
                        aria-controls="navbar-default" 
                        aria-expanded={!isCollapsed}
                    >
                        <span className="sr-only">{isCollapsed ? 'Hoofdmenu openen' : 'Hoofdmenu sluiten'}</span>
                        <span className="material-symbols-outlined" aria-hidden="true">
                            {isCollapsed ? 'menu' : 'close'}
                        </span>
                    </button>

                    {/* Navigation */}
                    <div 
                        className={`${isCollapsed ? 'hidden' : 'absolute top-full left-0 right-0 bg-[var(--neu-bg)] border-b border-[var(--neu-border)] shadow-lg'} md:relative md:block md:w-auto md:bg-transparent md:border-0 md:shadow-none`} 
                        id="navbar-default"
                    >
                        <ul className="flex flex-col p-4 md:p-0 gap-2 md:flex-row md:items-center md:gap-2">
                            {routes.map(route => (
                                <li key={route.name}>
                                    <NavLink 
                                        to={route.ref} 
                                        className={({ isActive }) => isActive ? activeNavLink : inactiveNavLink} 
                                        aria-current="page"
                                        onClick={() => setIsCollapsed(true)}
                                    >
                                        {route.name}
                                    </NavLink>
                                </li>
                            ))}
                            
                            {/* Divider (desktop) */}
                            <li className="hidden md:block w-px h-6 bg-[var(--gray-300)]/50 mx-3"></li>
                            
                            {/* Theme Toggle */}
                            <li className="flex items-center py-2 md:py-0">
                                <ThemeToggle />
                            </li>
                            
                            {/* Sign out */}
                            <li>
                                <button 
                                    onClick={() => { setIsCollapsed(true); signOut(); }} 
                                    className="flex items-center gap-2 py-2.5 px-5 md:px-4 md:py-2 text-text-secondary font-semibold rounded-2xl hover:text-red-500 hover:bg-red-50/50 transition-all duration-200 w-full md:w-auto"
                                    aria-label="Uitloggen"
                                >
                                    <span className="material-symbols-outlined text-lg" aria-hidden="true">logout</span>
                                    <span className="md:hidden lg:inline">Uitloggen</span>
                                </button>
                            </li>
                            
                            {/* Profile section with clickable avatar */}
                            {(authData.type === "student" || authData.type === "supervisor" || authData.type === "teacher") && (
                                <li className="flex items-center gap-2 ml-3">
                                    {/* Business indicator for supervisors - neumorphic logo with expanding text */}
                                    {authData.type === "supervisor" && businessData && (
                                        <Link 
                                            to={`/business/${authData.businessId}`}
                                            className="flex items-center group"
                                            onClick={() => setIsCollapsed(true)}
                                        >
                                            {/* Neumorphic container */}
                                            <div className="relative flex items-center neu-pressed rounded-xl p-1 group-hover:shadow-[inset_2px_2px_4px_rgba(209,217,230,0.8),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] transition-all duration-300">
                                                {/* Logo */}
                                                {businessData.image_path && businessData.image_path !== 'default.png' ? (
                                                    <img 
                                                        src={`${IMAGE_BASE_URL}${businessData.image_path}`}
                                                        alt={businessData.name}
                                                        className="w-8 h-8 rounded-lg object-cover shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                                                        <span className="font-bold text-primary text-xs">
                                                            {businessData.name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'B'}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {/* Expanding text container - hidden on mobile */}
                                                <div className="hidden md:block overflow-hidden max-w-0 group-hover:max-w-[120px] transition-all duration-300 ease-out">
                                                    <span className="pl-2 pr-2 text-xs font-bold text-[var(--text-muted)] group-hover:text-primary whitespace-nowrap transition-colors duration-200">
                                                        {businessData.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    )}
                                    
                                    {/* Teacher indicator - neumorphic badge with school icon */}
                                    {authData.type === "teacher" && (
                                        <Link 
                                            to="/teacher"
                                            className="flex items-center group"
                                            onClick={() => setIsCollapsed(true)}
                                            aria-label="Docent beheer"
                                        >
                                            {/* Neumorphic container */}
                                            <div className="relative flex items-center neu-pressed rounded-xl p-1 group-hover:shadow-[inset_2px_2px_4px_rgba(209,217,230,0.8),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] transition-all duration-300">
                                                {/* School icon */}
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-primary text-lg" aria-hidden="true">school</span>
                                                </div>
                                                
                                                {/* Expanding text container - hidden on mobile */}
                                                <div className="hidden md:block overflow-hidden max-w-0 group-hover:max-w-[80px] transition-all duration-300 ease-out">
                                                    <span className="pl-2 pr-2 text-xs font-bold text-[var(--text-muted)] group-hover:text-primary whitespace-nowrap transition-colors duration-200">
                                                        Docent
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    )}
                                    
                                    {/* Clickable Avatar - links to profile for students, business for supervisors */}
                                    {(authData.type === "student" || authData.type === "supervisor") ? (
                                        <Link 
                                            to={authData.type === "student" ? `/student/${authData.userId}` : `/business/${authData.businessId}`}
                                            className="group relative"
                                            onClick={() => setIsCollapsed(true)}
                                        >
                                            <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-br from-primary to-light-primary group-hover:scale-105 transition-transform">
                                                <img 
                                                    src={profilePicture} 
                                                    className="w-full h-full rounded-full object-cover neu-pressed p-0.5" 
                                                    alt="Profielfoto" 
                                                />
                                            </div>
                                            <div className="neu-status-online absolute bottom-0 right-0"></div>
                                        </Link>
                                    ) : (
                                        /* Non-clickable avatar for teachers */
                                        <div className="group relative">
                                            <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-br from-primary to-light-primary">
                                                <img 
                                                    src={profilePicture} 
                                                    className="w-full h-full rounded-full object-cover neu-pressed p-0.5" 
                                                    alt="Profielfoto" 
                                                />
                                            </div>
                                            <div className="neu-status-online absolute bottom-0 right-0"></div>
                                        </div>
                                    )}
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </nav>
            {/* Spacer for fixed navbar */}
            <div className="h-20"></div>
        </header>
    );
}
