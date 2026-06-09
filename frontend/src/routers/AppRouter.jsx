import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import MainLayout from "../components/layout/MainLayout"
import RegisterPage from "../pages/auth/RegisterPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import LoginPage from "../pages/auth/LoginPage";
import VerifyotpPage from "../pages/auth/VerifyotpPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import HomePage from "../pages/public/HomePage";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route  element={<PublicLayout/>}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          {/* auth route */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />}/>
          <Route path="/verify-otp"element={<VerifyotpPage />}/>
          <Route path="/register/verify-otp" element={<VerifyotpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

        </Route>
        <Route  element={<MainLayout/>}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
