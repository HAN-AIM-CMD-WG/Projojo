import { createContext, useContext, useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { getAuthorization } from '../services';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authData, setAuthData] = useState({ type: "none", userId: null, businessId: null, isLoading: true });

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