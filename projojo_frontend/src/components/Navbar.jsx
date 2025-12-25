import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { IMAGE_BASE_URL, getUser } from "../services";
import { useAuth } from "../auth/AuthProvider";

export default function Navbar() {
    const { authData, logout } = useAuth();
    const [profilePicture, setProfilePicture] = useState("/default_profile_picture.png");
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

        if (authData.type !== "none") {
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

    const activeNavLink = "block py-2 px-3 text-white bg-primary rounded md:bg-transparent md:text-primary md:p-0 transition-colors"
    const inactiveNavLink = "block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-primary md:p-0"

    // Source: https://flowbite.com/docs/components/navbar/
    return (
        <header>
            <nav ref={navRef} className="bg-gray-100 border-gray-200 fixed w-full z-20 top-0 start-0">
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                    <Link to="/home" className="flex items-center space-x-3">
                        <img src="/han_logo.png" className="h-6 mt-1" alt="Han Logo" />
                        <span className="self-center text-2xl font-semibold whitespace-nowrap">Opdrachtenbox</span>
                    </Link>
                    <button data-collapse-toggle="navbar-default" type="button" onClick={toggleCollapse} className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200" aria-controls="navbar-default" aria-expanded={!isCollapsed}>
                        <span className="sr-only">Hoofdmenu openen</span>
                        <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15" />
                        </svg>
                    </button>
                    <div className={`${isCollapsed ? 'hidden' : ''} w-full md:block md:w-auto`} id="navbar-default">
                        <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg md:flex-row md:space-x-8 md:mt-0 md:border-0">
                            {routes.map(route => (
                                <li key={route.name} className="flex items-center">
                                    <NavLink to={route.ref} className={({ isActive }) => isActive ? activeNavLink : inactiveNavLink} aria-current="page">
                                        {route.name}
                                    </NavLink>
                                </li>
                            ))}
                            <li key="sign-out" className="flex items-center">
                                <button onClick={signOut} className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-primary md:p-0">
                                    Uitloggen
                                </button>
                            </li>
                            {authData.type !== "none" &&
                                <li key="profile-picture" className="flex items-center ml-2">
                                    <img src={profilePicture} className="w-8 h-8 rounded-full" alt="Standaard profielfoto" />
                                </li>
                            }
                        </ul>
                    </div>
                </div>
            </nav>
            <div className="h-32"></div>
        </header>
    );
}
