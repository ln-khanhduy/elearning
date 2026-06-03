import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "../pages/auth/RegisterPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import LoginPage from "../pages/auth/LoginPage";
import OAuthSuccessPage from "../pages/auth/OauthSuccsessPage";
import VerifyotpPage from "../pages/auth/VerifyotpPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import HomePage from "../pages/public/HomePage";
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        {/* auth route */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
          <Route path="/oauth-success" element={<OAuthSuccessPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />}/>
        <Route path="/verify-otp"element={<VerifyotpPage />}/>
        <Route path="/register/verify-otp" element={<VerifyotpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
