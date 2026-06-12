import {forgotPasswordApi, loginApi, resetPasswordApi, sendRegisterOtpApi, verifyOtpApi, verifyRegisterOtpApi, resendRegisterOtpApi, } from "../api/authAPI";
import { clearAuthSessionData, setAccessToken } from '../utils/authToken';
import { refreshTokenApi } from "../api/authAPI";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    throw new Error('Email không được để trống.');
  }
  if (!emailRegex.test(email)) {
    throw new Error('Email không hợp lệ.');
  }
};

export const validateLogin = ({ email, password }) => {
  if (!email || !email.trim()) {
    throw new Error('Email không được để trống.');
  }
  if (!password || !password.trim()) {
    throw new Error('Mật khẩu không được để trống.');
  }
};

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

export const validateOtpCode = (otp) => {
  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    throw new Error('Vui lòng nhập đầy đủ 6 chữ số OTP.');
  }
};

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


export const login = async ({ email, password }) => {
  validateLogin({ email, password });
  clearAuthSessionData();
  const response = await loginApi({ email, password });
  setAccessToken(response.access);
  return response;
};

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

export const forgotPassword = async (email) => {
  validateEmail(email);
  await forgotPasswordApi({ email });
  sessionStorage.setItem('reset_email', email);
};

export const verifyOtp = async (email,otp) => {
  validateEmail(email);
  validateOtpCode(otp);

  return await verifyOtpApi({email,otp,});
};

export const resendOtp = async (email) => {
  validateEmail(email);
  await forgotPasswordApi({ email: email.toLowerCase().trim() });
};

export const resetPassword = async (token, password, confirmPassword) => {
  if (!token) {
    throw new Error('Token không hợp lệ.');
  }
  validateResetPassword({ password, confirmPassword });
  await resetPasswordApi({ token, password, confirm_password: confirmPassword });
  sessionStorage.removeItem('reset_email');
};

export const exchangeRefreshForAccess = async () => {
  const response = await refreshTokenApi();

  if (response.access) {
    setAccessToken(response.access);
  }

  return response;
};

export const resendRegisterOtp = async (email) => {
  validateEmail(email);

  await resendRegisterOtpApi({
    email: email.toLowerCase().trim(),
  });
};
