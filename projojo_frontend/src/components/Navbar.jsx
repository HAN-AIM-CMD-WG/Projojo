import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { IMAGE_BASE_URL, getUser } from "../services";
import { useAuth } from "../auth/AuthProvider";

export default function Navbar() {
    const { authData, logout } = useAuth();
    const [profilePicture, setProfilePicture] = useState("/default_profile_picture.png");
    const [isCollapsed, setIsCollapsed] = useState(true);
    const navigate = useNavigate();

    const routes = [];

    if (authData.type !== "invalid" && authData.type !== "none") {
        routes.push({
            name: "Home",
            ref: "/home",
        });
    }

    if (authData.type === "teacher") {
        routes.push({
            name: "Beheer",
            ref: "/teacher",
        });
    } else if (authData.type === "supervisor") {
        routes.push({
            name: "Mijn bedrijf",
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

        if (authData.type === "student") {
            getUser(authData.userId)
                .then(data => {
                    if (ignore) return;
                    setProfilePicture(`${IMAGE_BASE_URL}${data.image_path}`); // data.profilePicture is formatted like "/uuid.png"
                })
        }
        if (authData.type === "supervisor") {
            getUser(authData.userId)
                .then(data => {
                    if (ignore) return;
                    setProfilePicture(`${IMAGE_BASE_URL}${data.image_path}`); // data.profilePicture is formatted like "/uuid.png"
                })
        }

        return () => {
            ignore = true;
        }
    }, [authData])

    const signOut = () => {
        logout();
        navigate("/");
    }

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const activeNavLink = "flex items-center gap-2 py-2 px-4 text-primary font-bold rounded-xl bg-primary/10 md:bg-transparent md:px-0 transition-all duration-200"
    const inactiveNavLink = "flex items-center gap-2 py-2 px-4 text-text-secondary font-semibold rounded-xl hover:text-primary hover:bg-primary/5 md:hover:bg-transparent md:px-0 transition-all duration-200"

    return (
        <header>
            <nav className="bg-neu-bg fixed w-full z-40 top-0 start-0 border-b border-white/50" style={{ boxShadow: '0 4px 12px rgba(209, 217, 230, 0.5)' }}>
                <div className="max-w-7xl flex flex-wrap items-center justify-between mx-auto px-6 py-4">
                    {/* Logo */}
                    <Link to="/home" className="flex items-center space-x-3 group">
                        <img src="/han_logo.png" className="h-7 mt-0.5" alt="Han Logo" />
                        <span className="self-center text-xl font-extrabold text-text-primary whitespace-nowrap group-hover:text-primary transition-colors">
                            Opdrachtenbox
                        </span>
                    </Link>

                    {/* Mobile menu button */}
                    <button 
                        type="button" 
                        onClick={toggleCollapse} 
                        className="inline-flex items-center p-2 w-10 h-10 justify-center text-text-muted rounded-xl md:hidden neu-flat hover:text-primary transition-colors" 
                        aria-controls="navbar-default" 
                        aria-expanded={!isCollapsed}
                    >
                        <span className="sr-only">Hoofdmenu openen</span>
                        <span className="material-symbols-outlined">
                            {isCollapsed ? 'menu' : 'close'}
                        </span>
                    </button>

                    {/* Navigation */}
                    <div className={`${isCollapsed ? 'hidden' : ''} w-full md:block md:w-auto`} id="navbar-default">
                        <ul className="flex flex-col p-4 md:p-0 mt-4 gap-2 md:gap-1 md:flex-row md:items-center md:space-x-6 md:mt-0">
                            {routes.map(route => (
                                <li key={route.name}>
                                    <NavLink 
                                        to={route.ref} 
                                        className={({ isActive }) => isActive ? activeNavLink : inactiveNavLink} 
                                        aria-current="page"
                                    >
                                        {route.name}
                                    </NavLink>
                                </li>
                            ))}
                            
                            {/* Divider (desktop) */}
                            <li className="hidden md:block w-px h-6 bg-gray-300 mx-2"></li>
                            
                            {/* Sign out */}
                            <li>
                                <button 
                                    onClick={signOut} 
                                    className="flex items-center gap-2 py-2 px-4 md:px-0 text-text-secondary font-semibold rounded-xl hover:text-red-500 transition-all duration-200 w-full md:w-auto"
                                >
                                    <span className="material-symbols-outlined text-lg">logout</span>
                                    <span className="md:hidden lg:inline">Uitloggen</span>
                                </button>
                            </li>
                            
                            {/* Profile picture */}
                            {(authData.type === "student" || authData.type === "supervisor") && (
                                <li className="flex items-center ml-2">
                                    <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-br from-primary to-lightPrimary">
                                        <img 
                                            src={profilePicture} 
                                            className="w-full h-full rounded-full object-cover border-2 border-neu-bg" 
                                            alt="Profielfoto" 
                                        />
                                    </div>
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
