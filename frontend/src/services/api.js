
import axios from "axios";

// Backend API URL
const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api/"
).replace(/\/?$/, "/");

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Automatically attach JWT access token
api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("accessToken");

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Handle expired access tokens
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            localStorage.getItem("refreshToken")
        ) {
            originalRequest._retry = true;

            try {
                const response = await axios.post(
                    `${API_BASE_URL}auth/token/refresh/`,
                    {
                        refresh: localStorage.getItem("refreshToken"),
                    }
                );

                const newAccessToken = response.data.access;

                if (response.data.refresh) {
                    localStorage.setItem(
                        "refreshToken",
                        response.data.refresh
                    );
                }

                localStorage.setItem(
                    "accessToken",
                    newAccessToken
                );

                originalRequest.headers.Authorization =
                    `Bearer ${newAccessToken}`;

                return api(originalRequest);

            } catch (refreshError) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");

                window.location.href = "/login";

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
