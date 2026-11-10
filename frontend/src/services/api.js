
import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
    headers: {
        "Content-Type": "application/json",
    },
});

// Automatically attach JWT access token to API requests
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
            !originalRequest?._retry &&
            localStorage.getItem("refreshToken")
        ) {
            originalRequest._retry = true;

            try {
                const response = await axios.post(
                    "http://127.0.0.1:8000/api/auth/token/refresh/",
                    {
                        refresh: localStorage.getItem("refreshToken"),
                    }
                );

                const newAccessToken = response.data.access;

                if (response.data.refresh) {
    localStorage.setItem("refreshToken", response.data.refresh);
}

                localStorage.setItem("accessToken", newAccessToken);

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
