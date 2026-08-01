import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// Gửi mã OTP khi đăng ký tài khoản
export const sendRegisterOtpApi = async (data) => {
  return request(() => apiClient.post("/api/auth/register/send-otp/", data));
};

// Gửi lại mã OTP đăng ký
export const resendRegisterOtpApi = async (data) => {
  return request(() => apiClient.post("/api/auth/register/resend-otp/", data));
};

// Xác thực mã OTP để hoàn tất đăng ký
export const verifyRegisterOtpApi = async (data) => {
  return request(() => apiClient.post("/api/auth/register/verify-otp/", data));
};

// Đăng nhập bằng email và mật khẩu
export const loginApi = async (data) => {
  return request(() => apiClient.post("/api/auth/login/", data));
};

// Lấy thông tin phiên đăng nhập hiện tại (chưa đăng nhập thì trả về null)
export const getAuthSessionApi = async () => {
  try {
    const res = await apiClient.get("/api/auth/session/");
    return res.data;
  } catch (error) {
    // 401 = chưa đăng nhập -> return null, không throw
    if (error.response?.status === 401) {
      return null;
    }
    throw new Error(getErrorMessage(error));
  }
};

// Làm mới access token từ refresh token trong cookie
export const refreshTokenApi = async () => {
  return request(() => apiClient.post("/api/auth/token/refresh/"));
};

// Đăng xuất khỏi hệ thống
export const logoutApi = async () => {
  return request(() => apiClient.post("/api/auth/logout/"));
};

// Gửi yêu cầu quên mật khẩu (server gửi OTP qua email)
export const forgotPasswordApi = async (data) => {
  return request(() => apiClient.post("/api/auth/forgot-password/", data));
};

// Xác thực mã OTP dùng cho quên mật khẩu
export const verifyOtpApi = async (data) => {
  return request(() => apiClient.post("/api/auth/verify-otp/", data));
};

// Đặt lại mật khẩu mới sau khi xác thực OTP
export const resetPasswordApi = async (data) => {
  return request(() => apiClient.post("/api/auth/reset-password/", data));
};

// Đăng nhập bằng Google (dùng id_token)
export const googleIdTokenLoginApi = async (idToken) => {
  return request(() => apiClient.post("/api/auth/google/id-token-login/", {
    id_token: idToken,
  }));
};