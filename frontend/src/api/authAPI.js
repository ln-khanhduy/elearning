import apiClient, { getErrorMessage } from "./apiClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const sendRegisterOtpApi = async (data) => {
  return request(() => apiClient.post("/api/auth/register/send-otp/", data));
};

export const resendRegisterOtpApi = async (data) => {
  return request(() => apiClient.post("/api/auth/register/resend-otp/", data));
};

export const verifyRegisterOtpApi = async (data) => {
  return request(() => apiClient.post("/api/auth/register/verify-otp/", data));
};

export const loginApi = async (data) => {
  return request(() => apiClient.post("/api/auth/login/", data));
};

export const getAuthSessionApi = async () => {
  return request(() => apiClient.get("/api/auth/session/"));
};

export const refreshTokenApi = async () => {
  return request(() => apiClient.post("/api/auth/token/refresh/"));
};

export const logoutApi = async () => {
  return request(() => apiClient.post("/api/auth/logout/"));
};

export const forgotPasswordApi = async (data) => {
  return request(() => apiClient.post("/api/auth/forgot-password/", data));
};

export const verifyOtpApi = async (data) => {
  return request(() => apiClient.post("/api/auth/verify-otp/", data));
};

export const resetPasswordApi = async (data) => {
  return request(() => apiClient.post("/api/auth/reset-password/", data));
};

export const googleIdTokenLoginApi = async (idToken) => {
  const res = await apiClient.post("/api/auth/google/id-token-login/", {
    id_token: idToken,
  });

  return res.data;
};