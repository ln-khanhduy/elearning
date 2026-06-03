import { publicApiClient, apiClient } from "./apiClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const sendRegisterOtpApi = async (data) => {
  return await publicApiClient("/api/auth/register/send-otp/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const resendRegisterOtpApi = async (data) => {
  return await publicApiClient("/api/auth/register/resend-otp/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const verifyRegisterOtpApi = async (data) => {
  return await publicApiClient("/api/auth/register/verify-otp/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const loginApi = async (data) => {
  return await publicApiClient("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const refreshTokenApi = async () => {
  return await publicApiClient("/api/auth/token/refresh/", {
    method: "POST",
  });
};

export const logoutApi = async () => {
  return await apiClient(
    "/api/auth/logout/",
    {
      method: "POST",
    },
    false
  );
};

export const forgotPasswordApi = async (data) => {
  return await publicApiClient("/api/auth/forgot-password/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const verifyOtpApi = async (data) => {
  return await publicApiClient("/api/auth/verify-otp/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const resetPasswordApi = async (data) => {
  return await publicApiClient("/api/auth/reset-password/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const googleLoginUrl = `${API_URL}/api/auth/google/login/`;