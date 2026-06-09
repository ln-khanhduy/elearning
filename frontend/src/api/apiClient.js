import axios from "axios";
import { getAccessToken, setAccessToken, clearAuthSessionData } from "../utils/authToken";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getCookie = (name) => {
  const cookieValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return cookieValue ? decodeURIComponent(cookieValue.split("=")[1]) : null;
};

export const getErrorMessage = (error) => {
  const data = error.response?.data;

  if (!data) return "Có lỗi xảy ra. Vui lòng thử lại.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  if (data.error) return data.error;
  if (data.message) return data.message;

  const firstKey = Object.keys(data)[0];

  if (firstKey) {
    const value = data[firstKey];
    if (Array.isArray(value)) return value[0];
    if (typeof value === "string") return value;
  }

  return "Có lỗi xảy ra. Vui lòng thử lại.";
};

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();
    const csrfToken = getCookie("csrftoken");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (csrfToken) {
      config.headers["X-CSRFToken"] = csrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const url = originalRequest?.url || "";
    const isAuthSessionUrl = url.includes("/api/auth/session/");
    const isRefreshUrl = url.includes("/api/auth/token/refresh/");

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isRefreshUrl &&
      !isAuthSessionUrl
    ) {
      originalRequest._retry = true;

      try {
        const res = await apiClient.post("/api/auth/token/refresh/");
        const newAccessToken = res.data.access;

        if (newAccessToken) {
          setAccessToken(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        clearAuthSessionData();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
