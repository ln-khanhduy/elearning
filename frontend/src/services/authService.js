import {forgotPasswordApi, loginApi, resetPasswordApi, sendRegisterOtpApi, verifyOtpApi, verifyRegisterOtpApi, resendRegisterOtpApi, } from "../api/authAPI";
import { clearAuthSessionData, setAccessToken } from '../utils/authToken';
import { refreshTokenApi } from "../api/authAPI";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

// Kiểm tra định dạng email hợp lệ
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    throw new Error('Email không được để trống.');
  }
  if (!emailRegex.test(email)) {
    throw new Error('Email không hợp lệ.');
  }
};

// Kiểm tra thông tin đăng nhập (email + mật khẩu không để trống)
export const validateLogin = ({ email, password }) => {
  if (!email || !email.trim()) {
    throw new Error('Email không được để trống.');
  }
  if (!password || !password.trim()) {
    throw new Error('Mật khẩu không được để trống.');
  }
};

// Kiểm tra toàn bộ dữ liệu đăng ký (tên, email, mật khẩu, xác nhận mật khẩu, đồng ý điều khoản)
export const validateRegister = ({fullName, email, password, confirmPassword, acceptedTerms,}) => {
  if (!fullName || !fullName.trim()) {
    throw new Error("Họ và tên không được để trống.");
  }
  validateEmail(email);
  if (!password || !password.trim()) {
    throw new Error("Mật khẩu không được để trống.");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error("Mật khẩu phải lớn hơn 6 ký tự.");
  }
  if (!confirmPassword || !confirmPassword.trim()) {
    throw new Error("Nhập lại mật khẩu không được để trống.");
  }
  if (password !== confirmPassword) {
    throw new Error("Mật khẩu xác nhận không khớp.");
  }
  if (!acceptedTerms) {
    throw new Error("Bạn phải đồng ý với Điều khoản và Chính sách bảo mật.");
  }
};

// Kiểm tra mã OTP phải đủ 6 chữ số
export const validateOtpCode = (otp) => {
  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    throw new Error('Vui lòng nhập đầy đủ 6 chữ số OTP.');
  }
};

// Kiểm tra mật khẩu mới và xác nhận mật khẩu khớp nhau
export const validateResetPassword = ({ password, confirmPassword }) => {
  if (!password || !password.trim()) {
    throw new Error('Mật khẩu mới không được để trống.');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`);
  }
  if (!confirmPassword || !confirmPassword.trim()) {
    throw new Error('Xác nhận mật khẩu không được để trống.');
  }
  if (password !== confirmPassword) {
    throw new Error('Mật khẩu xác nhận không khớp.');
  }
};


// Đăng nhập bằng email + mật khẩu và lưu access token
export const login = async ({ email, password }) => {
  validateLogin({ email, password });
  clearAuthSessionData();
  const response = await loginApi({ email, password });
  setAccessToken(response.access);
  return response;
};

// Gửi mã OTP đăng ký sau khi kiểm tra dữ liệu và lưu email vào sessionStorage
export const sendRegisterOtp = async ({fullName, email,password, confirmPassword,acceptedTerms,}) => {
  validateRegister({fullName, email,password, confirmPassword,acceptedTerms,});

  await sendRegisterOtpApi({
    full_name: fullName.trim(),
    email: email.toLowerCase().trim(),
    password,
    confirm_password: confirmPassword,
    accepted_terms: acceptedTerms,
  });
  sessionStorage.setItem("register_email", email.toLowerCase().trim());
};

// Xác thực mã OTP đăng ký và lưu access token
export const verifyRegisterOtp = async (email, otp) => {
  validateEmail(email);
  validateOtpCode(otp);

  const response = await verifyRegisterOtpApi({
    email: email.toLowerCase().trim(),
    otp,
  });

  setAccessToken(response.access);
  sessionStorage.removeItem("register_email");
  return response;
};

// Gửi yêu cầu quên mật khẩu và lưu email đặt lại vào sessionStorage
export const forgotPassword = async (email) => {
  validateEmail(email);
  await forgotPasswordApi({ email });
  sessionStorage.setItem('reset_email', email);
};

// Xác thực mã OTP dùng cho quên mật khẩu
export const verifyOtp = async (email,otp) => {
  validateEmail(email);
  validateOtpCode(otp);

  return await verifyOtpApi({email,otp,});
};

// Gửi lại mã OTP quên mật khẩu
export const resendOtp = async (email) => {
  validateEmail(email);
  await forgotPasswordApi({ email: email.toLowerCase().trim() });
};

// Đặt lại mật khẩu mới sau khi xác thực OTP
export const resetPassword = async (token, password, confirmPassword) => {
  if (!token) {
    throw new Error('Token không hợp lệ.');
  }
  validateResetPassword({ password, confirmPassword });
  await resetPasswordApi({ token, password, confirm_password: confirmPassword });
  sessionStorage.removeItem('reset_email');
};

// Lấy access token mới từ refresh token
export const exchangeRefreshForAccess = async () => {
  const response = await refreshTokenApi();

  if (response.access) {
    setAccessToken(response.access);
  }

  return response;
};

// Gửi lại mã OTP đăng ký
export const resendRegisterOtp = async (email) => {
  validateEmail(email);

  await resendRegisterOtpApi({
    email: email.toLowerCase().trim(),
  });
};
