import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { getAuthorization } from '../services';
import { jwtDecode } from "jwt-decode";
import { notification } from "../components/notifications/NotifySystem";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const location = useLocation();
    const [authData, setAuthData] = useState({ type: "none", userId: null, businessId: null, isLoading: true });

    // Function to process token and set auth state
    const processToken = (token) => {
        try {
            const decoded = jwtDecode(token);
            const { sub, role, businessId } = decoded;

            if (role === "supervisor") {
                setAuthData({ type: "supervisor", userId: sub, businessId: businessId, isLoading: false });
            } else if (role === "student") {
                setAuthData({ type: "student", userId: sub, businessId: null, isLoading: false });
            } else if (role === "teacher") {
                setAuthData({ type: "teacher", userId: sub, businessId: null, isLoading: false });
            } else {
                // fallback
                setAuthData({ type: "none", userId: null, businessId: null, isLoading: false });
            }
            return true;
        } catch (err) {
            console.error("Invalid token:", err);
            localStorage.removeItem("token");
            setAuthData({ type: "none", userId: null, businessId: null, isLoading: false });
            return false;
        }
    };

    // Function to handle logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        setAuthData({ type: "none", userId: null, businessId: null, isLoading: false });
        notification.success("Je bent uitgelogd");
    };

    // Check for existing token on mount and whenever location changes
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            processToken(token);
        } else {
            setAuthData({ type: "none", userId: null, businessId: null, isLoading: false });
        }
    }, [location]);

    return (
        <AuthContext.Provider value={{
            authData,
            setAuthData,
            logout: handleLogout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * @returns { { authData: Awaited<ReturnType<typeof getAuthorization>> & { isLoading: boolean } }}
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
