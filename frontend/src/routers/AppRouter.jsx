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
import InstructorCourseDetailPage from "../pages/instructor/InstructorCourseDetailPage";
import InstructorCourseStudentsPage from "../pages/instructor/InstructorCourseStudentsPage";
import InstructorCourseAnalyticsPage from "../pages/instructor/InstructorCourseAnalyticsPage";
import InstructorCourseQAPage from "../pages/instructor/InstructorCourseQAPage";
import AdminCourseListPage from "../pages/admin/AdminCourseListPage";
import CourseBuilderPage from "../pages/course-builder/CourseBuilderPage";
import AdminCourseAssignPage from "../pages/admin/AdminCourseAssignPage";
import AdminCategoryPage from "../pages/admin/AdminCategoryPage";
import MyCoursesPage from "../pages/student/MyCoursesPage";
import CertificatesPage from "../pages/student/CertificatesPage";
import StudentCourseQAPage from "../pages/student/StudentCourseQAPage";
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
          <Route path="/dashboard" element={<ProtectedRoute allowedPermissions={["admin.dashboard.view"]}><AdminDashboardPage /></ProtectedRoute>} />

          {/* Học tập */}
          <Route path="/my-courses" element={<ProtectedRoute allowedPermissions={["student.my_course.view"]}><MyCoursesPage /></ProtectedRoute>} />
          <Route path="/my-certificates" element={<ProtectedRoute allowedPermissions={["student.course.view_certificate"]}><CertificatesPage /></ProtectedRoute>} />
          <Route path="/courses/:courseId/learn" element={<ProtectedRoute allowedPermissions={["student.learning.view"]}><LearningPage /></ProtectedRoute>} />
          <Route path="/courses/:courseId/learn/:lessonId" element={<ProtectedRoute allowedPermissions={["student.learning.view"]}><LearningPage /></ProtectedRoute>} />
          <Route path="/courses/:courseId/qa" element={<ProtectedRoute allowedPermissions={["course.comment.create"]}><StudentCourseQAPage /></ProtectedRoute>} />

          {/* Thanh toan */}
          <Route path="/courses/:courseId/checkout" element={<ProtectedRoute allowedPermissions={["student.course.buy"]}><CheckoutPage /></ProtectedRoute>} />
          <Route path="/payment/success" element={<ProtectedRoute allowedPermissions={["student.payment.create"]}><SuccessPage /></ProtectedRoute>} />
          <Route path="/payment/cancel" element={<ProtectedRoute allowedPermissions={["student.payment.create"]}><CancelPage /></ProtectedRoute>} />

          {/* ==================== ADMIN COURSES ==================== */}
          <Route path="/admin/courses" element={<ProtectedRoute allowedPermissions={["course.course.view"]}><AdminCourseListPage /></ProtectedRoute>} />
          <Route path="/admin/courses/create" element={<ProtectedRoute allowedPermissions={["course.course.create"]}><CourseBuilderPage mode="create" /></ProtectedRoute>} />
          <Route path="/admin/courses/:courseId/edit" element={<ProtectedRoute allowedPermissions={["course.course.update"]}><CourseBuilderPage mode="edit" /></ProtectedRoute>} />
          <Route path="/admin/courses/:courseId/assign" element={<ProtectedRoute allowedPermissions={["course.instructor.assign"]}><AdminCourseAssignPage /></ProtectedRoute>} />
          <Route path="/admin/courses/categories" element={<ProtectedRoute allowedPermissions={["course.category.view"]}><AdminCategoryPage /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute allowedPermissions={["course.review.view"]}><AdminReviewsPage /></ProtectedRoute>} />

          {/* ==================== INSTRUCTOR COURSES ==================== */}
          <Route path="/instructor/courses" element={<ProtectedRoute allowedPermissions={["instructor.course.view_own"]}><InstructorCoursesPage /></ProtectedRoute>} />
          <Route path="/instructor/courses/:courseId" element={<ProtectedRoute allowedPermissions={["instructor.course.manage_own"]}><InstructorCourseDetailPage /></ProtectedRoute>} />
          <Route path="/instructor/courses/:courseId/students" element={<ProtectedRoute allowedPermissions={["instructor.course.view_own"]}><InstructorCourseStudentsPage /></ProtectedRoute>} />
          <Route path="/instructor/courses/:courseId/analytics" element={<ProtectedRoute allowedPermissions={["instructor.course.view_own"]}><InstructorCourseAnalyticsPage /></ProtectedRoute>} />
          <Route path="/instructor/courses/:courseId/qa" element={<ProtectedRoute allowedPermissions={["course.comment.reply"]}><InstructorCourseQAPage /></ProtectedRoute>} />

          {/* Người dùng & Giáo viên */}
          <Route path="/admin/users" element={<ProtectedRoute allowedPermissions={["user.user.view"]}><UserManagementPage /></ProtectedRoute>} />
          <Route path="/admin/instructors" element={<ProtectedRoute allowedPermissions={["user.instructor.view"]}><InstructorListPage /></ProtectedRoute>} />
          <Route path="/admin/instructor-support" element={<ProtectedRoute allowedPermissions={["user.instructor.support"]}><></></ProtectedRoute>} />
          <Route path="/admin/register-instructor" element={<ProtectedRoute allowedPermissions={["user.instructor.approve"]}><AdminInstructorApplicationsPage /></ProtectedRoute>} />
          <Route path="/admin/complaints" element={<ProtectedRoute allowedPermissions={["user.user.complaint_resolve"]}><></></ProtectedRoute>} />

          {/* Tài chính */}
          <Route path="/finance/transactions" element={<ProtectedRoute allowedPermissions={["finance.finance.revenue_view"]}><FinanceTransactionsPage /></ProtectedRoute>} />
          <Route path="/finance/revenue" element={<ProtectedRoute allowedPermissions={["finance.finance.revenue_view"]}><></></ProtectedRoute>} />
          <Route path="/finance/fees" element={<ProtectedRoute allowedPermissions={["finance.finance.revenue_view"]}><></></ProtectedRoute>} />
          <Route path="/finance/reports" element={<ProtectedRoute allowedPermissions={["finance.finance.report_export"]}><></></ProtectedRoute>} />

          {/* Instructor */}
          <Route path="/instructor/revenue" element={<ProtectedRoute allowedPermissions={["user.instructor.sales_history"]}><InstructorRevenuePage /></ProtectedRoute>} />

          {/* Super Admin */}
          <Route path="/super-admin/admins" element={<ProtectedRoute allowedPermissions={["admin.admin.view"]}><></></ProtectedRoute>} />
          <Route path="/super-admin/roles" element={<ProtectedRoute allowedPermissions={["admin.admin.view"]}><></></ProtectedRoute>} />
          <Route path="/super-admin/permissions" element={<ProtectedRoute allowedPermissions={["admin.admin.view"]}><></></ProtectedRoute>} />
          <Route path="/super-admin/role-permissions" element={<ProtectedRoute allowedPermissions={["admin.admin.view"]}><></></ProtectedRoute>} />
          <Route path="/super-admin/activity-logs" element={<ProtectedRoute allowedPermissions={["admin.admin.view"]}><></></ProtectedRoute>} />
          <Route path="/super-admin/settings" element={<ProtectedRoute allowedPermissions={["admin.admin.view"]}><></></ProtectedRoute>} />

          {/* Tài khoản */}
          <Route path="/profile" element={<ProtectedRoute allowedPermissions={["student.profile.manage"]}><ProfilePage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute allowedPermissions={["user.user.notify"]}><></></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;








