import { createContext, useContext, useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { getAuthorization } from '../services';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authData, setAuthData] = useState({ type: "none", userId: null, businessId: null, isLoading: true });


    useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
        try {

        const decoded = jwtDecode(token);
        const { sub, role, business } = decoded;

        if (role === "supervisor") {
            setAuthData({ type: "supervisor", userId: sub, businessId: business, isLoading: false });
        } else if (role === "student") {
            setAuthData({ type: "student", userId: sub, businessId: null, isLoading: false });
        } else if (role === "teacher") {
            setAuthData({ type: "teacher", userId: sub, businessId: null, isLoading: false });
        } else {
            // fallback
            setAuthData({ type: "none", userId: null, businessId: null, isLoading: false });
        }
        } catch (err) {
        console.error("Invalid token:", err);
        localStorage.removeItem("token");
        setAuthData({ type: "none", userId: null, businessId: null, isLoading: false });
        }
    } else {
        setAuthData({ type: "none", userId: null, businessId: null, isLoading: false });
    }
    }, []);

    return (
        <AuthContext.Provider value={{ authData, setAuthData }}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * @returns { { authData: Awaited<ReturnType<typeof getAuthorization>> & { isLoading: boolean } }}
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);