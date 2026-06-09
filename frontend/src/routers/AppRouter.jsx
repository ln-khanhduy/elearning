import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import MainLayout from "../components/layout/MainLayout"
import ProtectedRoute from "./ProtectedRoute";
import RegisterPage from "../pages/auth/RegisterPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import LoginPage from "../pages/auth/LoginPage";
import VerifyotpPage from "../pages/auth/VerifyotpPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import HomePage from "../pages/public/HomePage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import ProfilePage from "../pages/profile/ProfilePage";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<VerifyotpPage />} />
          <Route path="/register/verify-otp" element={<VerifyotpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          {/* Dashboard - chỉ SUPERADMIN mới có thể xem */}
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["SUPERADMIN"]}><AdminDashboardPage /></ProtectedRoute>} />

          {/* Học tập */}
          <Route path="/courses" element={<ProtectedRoute allowedRoles={["STUDENT", "COURSE_ADMIN"]}><></></ProtectedRoute>} />
          <Route path="/my-courses" element={<ProtectedRoute allowedRoles={["STUDENT", "INSTRUCTOR"]}><></></ProtectedRoute>} />
          <Route path="/instructor/courses" element={<ProtectedRoute allowedRoles={["INSTRUCTOR", "SUPERADMIN"]}><></></ProtectedRoute>} />
          <Route path="/admin/courses/pending" element={<ProtectedRoute allowedRoles={["COURSE_ADMIN"]}><></></ProtectedRoute>} />
          <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={["COURSE_ADMIN", "SUPERADMIN"]}><></></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute allowedRoles={["COURSE_ADMIN"]}><></></ProtectedRoute>} />

          {/* Người dùng & Giảng viên */}
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["USER_MANAGER", "SUPERADMIN"]}><></></ProtectedRoute>} />
          <Route path="/instructor/apply" element={<ProtectedRoute allowedRoles={["STUDENT"]}><></></ProtectedRoute>} />
          <Route path="/admin/instructors" element={<ProtectedRoute allowedRoles={["INSTRUCTOR_MANAGER", "SUPERADMIN"]}><></></ProtectedRoute>} />
          <Route path="/admin/instructor-support" element={<ProtectedRoute allowedRoles={["INSTRUCTOR_MANAGER"]}><></></ProtectedRoute>} />
          <Route path="/admin/register-instructor" element={<ProtectedRoute allowedRoles={["INSTRUCTOR_MANAGER", "SUPERADMIN"]}><></></ProtectedRoute>} />
          <Route path="/admin/complaints" element={<ProtectedRoute allowedRoles={["USER_MANAGER"]}><></></ProtectedRoute>} />

          {/* Tài chính */}
          <Route path="/finance/revenue" element={<ProtectedRoute allowedRoles={["FINANCE_ADMIN"]}><></></ProtectedRoute>} />
          <Route path="/finance/transactions" element={<ProtectedRoute allowedRoles={["FINANCE_ADMIN"]}><></></ProtectedRoute>} />
          <Route path="/finance/fees" element={<ProtectedRoute allowedRoles={["FINANCE_ADMIN"]}><></></ProtectedRoute>} />
          <Route path="/finance/reports" element={<ProtectedRoute allowedRoles={["FINANCE_ADMIN"]}><></></ProtectedRoute>} />

          {/* Super Admin */}
          <Route path="/super-admin/admins" element={<ProtectedRoute allowedRoles={["SUPERADMIN"]}><></></ProtectedRoute>} />
          <Route path="/super-admin/roles" element={<ProtectedRoute allowedRoles={["SUPERADMIN"]}><></></ProtectedRoute>} />
          <Route path="/super-admin/permissions" element={<ProtectedRoute allowedRoles={["SUPERADMIN"]}><></></ProtectedRoute>} />
          <Route path="/super-admin/role-permissions" element={<ProtectedRoute allowedRoles={["SUPERADMIN"]}><></></ProtectedRoute>} />
          <Route path="/super-admin/activity-logs" element={<ProtectedRoute allowedRoles={["SUPERADMIN"]}><></></ProtectedRoute>} />
          <Route path="/super-admin/settings" element={<ProtectedRoute allowedRoles={["SUPERADMIN"]}><></></ProtectedRoute>} />

          {/* Tài khoản */}
          <Route path="/profile" element={<ProtectedRoute allowedRoles={["STUDENT", "INSTRUCTOR", "COURSE_ADMIN", "INSTRUCTOR_MANAGER", "USER_MANAGER", "FINANCE_ADMIN", "SUPERADMIN"]}><ProfilePage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute allowedRoles={["STUDENT", "INSTRUCTOR", "COURSE_ADMIN", "INSTRUCTOR_MANAGER", "USER_MANAGER", "FINANCE_ADMIN", "SUPERADMIN"]}><></></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
