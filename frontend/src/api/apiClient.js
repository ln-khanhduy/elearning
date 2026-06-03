import {
  getAccessToken,
  setAccessToken,
  clearAuthSessionData,
} from "../utils/authToken";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getCookie = (name) => {
  const cookieValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return cookieValue ? decodeURIComponent(cookieValue.split("=")[1]) : null;
};

const buildHeaders = (extraHeaders = {}) => {
  const headers = {
    "Content-Type": "application/json",
    "X-CSRFToken": getCookie("csrftoken") || "",
    ...extraHeaders,
  };

  const accessToken = getAccessToken();

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
};

export const extractErrorMessage = (body) => {
  if (!body) return "Lỗi phản hồi từ server.";

  if (typeof body === "string") return body;

  if (body.detail) return body.detail;
  if (body.error) return body.error;
  if (body.message) return body.message;

  const firstKey = Object.keys(body)[0];

  if (firstKey) {
    const value = body[firstKey];

    if (Array.isArray(value)) {
      return value[0];
    }

    if (typeof value === "string") {
      return value;
    }
  }

  return "Lỗi phản hồi từ server.";
};

export const parseResponse = async (response) => {
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(extractErrorMessage(body));
  }

  return body;
};

const refreshAccessToken = async () => {
  const response = await fetch(`${API_URL}/api/auth/token/refresh/`, {
    method: "POST",
    credentials: "include",
    headers: buildHeaders(),
  });

  return parseResponse(response);
};

export const publicApiClient = async (url, options = {}) => {
  const response = await fetch(`${API_URL}${url}`, {
    credentials: "include",
    ...options,
    headers: buildHeaders(options.headers),
  });

  return parseResponse(response);
};

export const apiClient = async (url, options = {}, retry = true) => {
  let response = await fetch(`${API_URL}${url}`, {
    credentials: "include",
    ...options,
    headers: buildHeaders(options.headers),
  });

  if (response.status === 401 && retry) {
    try {
      const refreshResponse = await refreshAccessToken();

      if (refreshResponse.access) {
        setAccessToken(refreshResponse.access);
      }

      response = await fetch(`${API_URL}${url}`, {
        credentials: "include",
        ...options,
        headers: buildHeaders(options.headers),
      });
    } catch (error) {
      clearAuthSessionData();
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
  }

  return parseResponse(response);
};