
import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [accessToken, setAccessToken] = useState(
        localStorage.getItem("accessToken")
    );

    const [refreshToken, setRefreshToken] = useState(
        localStorage.getItem("refreshToken")
    );

    const isAuthenticated = Boolean(accessToken);

    // LOGIN
    const login = async (credentials) => {
        const response = await api.post("auth/token/", credentials);

        const { access, refresh } = response.data;

        localStorage.setItem("accessToken", access);
        localStorage.setItem("refreshToken", refresh);

        setAccessToken(access);
        setRefreshToken(refresh);

        return response.data;
    };

    // REGISTER
    const register = async (userData) => {
        const response = await api.post("auth/register/", userData);

        return response.data;
    };

    // LOGOUT
    const logout = async () => {
        try {
            if (refreshToken) {
                await api.post("auth/logout/", {
                    refresh: refreshToken,
                });
            }
        } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");

            setAccessToken(null);
            setRefreshToken(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                accessToken,
                refreshToken,
                isAuthenticated,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
