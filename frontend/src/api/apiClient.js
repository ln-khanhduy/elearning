import axios from "axios";
import { getAccessToken, setAccessToken, clearAuthSessionData } from "../utils/authToken";

const API_URL = import.meta.env.VITE_API_URL || "";

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
  
  // Ưu tiên lấy message từ detail/error/message
  if (data.detail) {
    const msg = String(data.detail);
    // Nếu bị DRF ErrorDetail serialize kèm metadata, parse lấy text
    if (msg.includes("string='")) {
      const match = msg.match(/string='([^']+)'/);
      if (match) return match[1];
    }
    return msg;
  }
  if (data.error) {
    const msg = String(data.error);
    if (msg.includes("string='")) {
      const match = msg.match(/string='([^']+)'/);
      if (match) return match[1];
    }
    return msg;
  }
  if (data.message) {
    const msg = String(data.message);
    if (msg.includes("string='")) {
      const match = msg.match(/string='([^']+)'/);
      if (match) return match[1];
    }
    return msg;
  }

  // Hàm đệ quy để lấy message lỗi đầu tiên từ nested object
  const extractFirstError = (obj) => {
    if (!obj || typeof obj !== "object") return null;
    if (Array.isArray(obj)) {
      if (obj.length === 0) return null;
      const first = obj[0];
      if (typeof first === "string") return first;
      if (typeof first === "object") return extractFirstError(first);
      return null;
    }
    const keys = Object.keys(obj);
    if (keys.length === 0) return null;
    const firstKey = keys[0];
    const value = obj[firstKey];
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      const first = value[0];
      if (typeof first === "string") return first;
      if (typeof first === "object") return extractFirstError(first);
      return null;
    }
    if (typeof value === "object") return extractFirstError(value);
    return null;
  };

  const extracted = extractFirstError(data);
  if (extracted) return extracted;

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
