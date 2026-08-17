import axios from "axios";
import { getAccessToken, setAccessToken, clearAuthSessionData } from "../utils/authToken";

const API_URL = import.meta.env.VITE_API_URL || "";

// Đọc giá trị cookie theo tên (dùng để lấy CSRF token)
const getCookie = (name) => {
  const cookieValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return cookieValue ? decodeURIComponent(cookieValue.split("=")[1]) : null;
};

/** Lỗi backend cần chặn hiển thị toast (khóa đã public) */
const SUPPRESSED_ERROR_PATTERNS = ["Khóa đã public"];

export const isSuppressedError = (msg) => {
  const text = String(msg || "");
  return SUPPRESSED_ERROR_PATTERNS.some((pat) => text.includes(pat));
};

export const getErrorMessage = (error) => {
  const data = error.response?.data;

  if (!data) return "Có lỗi xảy ra. Vui lòng thử lại.";
  if (typeof data === "string") {
    if (isSuppressedError(data)) return "";
    return data;
  }
  
  // Ưu tiên lấy message từ detail/error/message
  if (data.detail) {
    const msg = String(data.detail);
    // Nếu bị DRF ErrorDetail serialize kèm metadata, parse lấy text
    if (msg.includes("string='")) {
      const match = msg.match(/string='([^']+)'/);
      if (match) {
        if (isSuppressedError(match[1])) return "";
        return match[1];
      }
    }
    if (isSuppressedError(msg)) return "";
    return msg;
  }
  if (data.error) {
    const msg = String(data.error);
    if (msg.includes("string='")) {
      const match = msg.match(/string='([^']+)'/);
      if (match) {
        if (isSuppressedError(match[1])) return "";
        return match[1];
      }
    }
    if (isSuppressedError(msg)) return "";
    return msg;
  }
  if (data.message) {
    const msg = String(data.message);
    if (msg.includes("string='")) {
      const match = msg.match(/string='([^']+)'/);
      if (match) {
        if (isSuppressedError(match[1])) return "";
        return match[1];
      }
    }
    if (isSuppressedError(msg)) return "";
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

// Tạo instance axios dùng chung với baseURL từ biến môi trường và gửi kèm cookie
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Interceptor request: tự động gắn Authorization (Bearer token) và CSRF token vào mọi yêu cầu
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

// Interceptor response: khi gặp 401 sẽ tự động refresh token và thử lại yêu cầu
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Chặn toàn cục lỗi "Khóa đã public..." — thay bằng chuỗi rỗng
    // để KHÔNG component nào (kể cả đọc error.response.data.detail trực tiếp)
    // hiển thị toast này được.
    const respData = error.response?.data;
    if (respData) {
      if (typeof respData === "string" && isSuppressedError(respData)) {
        error.response.data = "";
      } else if (typeof respData === "object") {
        if (respData.detail && isSuppressedError(String(respData.detail))) {
          respData.detail = "";
        }
        if (respData.error && isSuppressedError(String(respData.error))) {
          respData.error = "";
        }
        if (respData.message && isSuppressedError(String(respData.message))) {
          respData.message = "";
        }
      }
    }

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
      // Skip retry for FormData requests — FormData stream is consumed after first send
      if (originalRequest.data instanceof FormData) {
        return Promise.reject(error);
      }

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
        // Redirect to login với return URL để sau login quay lại
        const currentPath = window.location.pathname;
        if (currentPath !== "/login" && currentPath !== "/register") {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
