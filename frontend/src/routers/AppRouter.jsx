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
import CoursesPage from "../pages/public/CoursesPage";
import CourseDetailPage from "../pages/public/course-detail/CourseDetailPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import ProfilePage from "../pages/public/ProfilePage";
import InstructorApplyPage from "../pages/instructor/InstructorApplyPage";
import AdminInstructorApplicationsPage from "../pages/admin/AdminInstructorApplicationsPage";
import InstructorCoursesPage from "../pages/instructor/InstructorCoursesPage";
import InstructorCourseCreatePage from "../pages/instructor/InstructorCourseCreatePage";
import InstructorCourseEditPage from "../pages/instructor/InstructorCourseEditPage";
import AdminPendingCoursesPage from "../pages/admin/AdminPendingCoursesPage";
import AdminCategoryPage from "../pages/admin/AdminCategoryPage";
import MyCoursesPage from "../pages/student/MyCoursesPage";
import CertificatesPage from "../pages/student/CertificatesPage";
import LearningPage from "../pages/learning/LearningPage";
import AdminReviewsPage from "../pages/admin/AdminReviewsPage";
import InstructorListPage from "../pages/admin/InstructorListPage";
import UserManagementPage from "../pages/admin/UserManagementPage";

// Payment Pages
import CheckoutPage from "../pages/public/payment/CheckoutPage";
import SuccessPage from "../pages/public/payment/SuccessPage";
import CancelPage from "../pages/public/payment/CancelPage";
import InstructorRevenuePage from "../pages/instructor/InstructorRevenuePage";
import FinanceTransactionsPage from "../pages/admin/FinanceTransactionsPage";


function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:courseId" element={<CourseDetailPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<VerifyotpPage />} />
          <Route path="/register/verify-otp" element={<VerifyotpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          {/* Public instructor apply - không cần đăng nhập */}
          <Route path="/instructor/apply" element={<InstructorApplyPage />} />
        </Route>
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          {/* Dashboard - chỉ SUPERADMIN mới có thể xem */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["SUPERADMIN"]}><AdminDashboardPage /></ProtectedRoute>} />

          {/* Học tập */}
          <Route path="/my-courses" element={<ProtectedRoute allowedRoles={["STUDENT", "INSTRUCTOR"]}><MyCoursesPage /></ProtectedRoute>} />
          <Route path="/my-certificates" element={<ProtectedRoute allowedRoles={["STUDENT", "INSTRUCTOR"]}><CertificatesPage /></ProtectedRoute>} />
          <Route path="/courses/:courseId/learn" element={<ProtectedRoute allowedRoles={["STUDENT", "INSTRUCTOR"]}><LearningPage /></ProtectedRoute>} />
          <Route path="/courses/:courseId/learn/:lessonId" element={<ProtectedRoute allowedRoles={["STUDENT", "INSTRUCTOR"]}><LearningPage /></ProtectedRoute>} />

          {/* Thanh toán */}
          <Route path="/courses/:courseId/checkout" element={<ProtectedRoute allowedRoles={["STUDENT", "INSTRUCTOR"]}><CheckoutPage /></ProtectedRoute>} />
          <Route path="/payment/success" element={<ProtectedRoute allowedRoles={["STUDENT", "INSTRUCTOR"]}><SuccessPage /></ProtectedRoute>} />
          <Route path="/payment/cancel" element={<ProtectedRoute allowedRoles={["STUDENT", "INSTRUCTOR"]}><CancelPage /></ProtectedRoute>} />



          <Route path="/instructor/courses" element={<ProtectedRoute allowedRoles={["INSTRUCTOR", "SUPERADMIN"]}><InstructorCoursesPage /></ProtectedRoute>} />
          <Route path="/instructor/courses/create" element={<ProtectedRoute allowedRoles={["INSTRUCTOR", "SUPERADMIN"]}><InstructorCourseCreatePage /></ProtectedRoute>} />
          <Route path="/instructor/courses/:courseId/edit" element={<ProtectedRoute allowedRoles={["INSTRUCTOR", "SUPERADMIN"]}><InstructorCourseEditPage /></ProtectedRoute>} />
          <Route path="/admin/courses/pending" element={<ProtectedRoute allowedRoles={["COURSE_ADMIN", "SUPERADMIN"]}><AdminPendingCoursesPage /></ProtectedRoute>} />
          <Route path="/admin/courses/categories" element={<ProtectedRoute allowedRoles={["COURSE_ADMIN", "SUPERADMIN"]}><AdminCategoryPage /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute allowedRoles={["COURSE_ADMIN", "SUPERADMIN"]}><AdminReviewsPage /></ProtectedRoute>} />

          {/* Người dùng & Giảng viên */}
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["SUPERADMIN"]}><UserManagementPage /></ProtectedRoute>} />
          <Route path="/admin/instructors" element={<ProtectedRoute allowedRoles={["INSTRUCTOR_MANAGER", "SUPERADMIN"]}><InstructorListPage /></ProtectedRoute>} />
          <Route path="/admin/instructor-support" element={<ProtectedRoute allowedRoles={["INSTRUCTOR_MANAGER"]}><></></ProtectedRoute>} />
          <Route path="/admin/register-instructor" element={<ProtectedRoute allowedRoles={["INSTRUCTOR_MANAGER", "SUPERADMIN"]}><AdminInstructorApplicationsPage /></ProtectedRoute>} />
          <Route path="/admin/complaints" element={<ProtectedRoute allowedRoles={["USER_MANAGER", "SUPERADMIN"]}><></></ProtectedRoute>} />

          {/* Tài chính */}
          <Route path="/finance/transactions" element={<ProtectedRoute allowedRoles={["FINANCE_ADMIN","SUPERADMIN"]}><FinanceTransactionsPage /></ProtectedRoute>} />
          <Route path="/finance/revenue" element={<ProtectedRoute allowedRoles={["FINANCE_ADMIN","SUPERADMIN"]}><></></ProtectedRoute>} />
          <Route path="/finance/fees" element={<ProtectedRoute allowedRoles={["FINANCE_ADMIN","SUPERADMIN"]}><></></ProtectedRoute>} />
          <Route path="/finance/reports" element={<ProtectedRoute allowedRoles={["FINANCE_ADMIN"]}><></></ProtectedRoute>} />

          {/* Instructor */}
          <Route path="/instructor/revenue" element={<ProtectedRoute allowedRoles={["INSTRUCTOR","SUPERADMIN"]}><InstructorRevenuePage /></ProtectedRoute>} />


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
