import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import MainLayout from "../components/layout/MainLayout"
import ProtectedRoute from "./ProtectedRoute";
import ErrorBoundary from "../components/common/ErrorBoundary";

// Lazy load all pages
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const VerifyotpPage = lazy(() => import("../pages/auth/VerifyotpPage"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage"));
const HomePage = lazy(() => import("../pages/public/HomePage"));
const CoursesPage = lazy(() => import("../pages/public/CoursesPage"));
const ContactPage = lazy(() => import("../pages/public/ContactPage"));
const CourseDetailPage = lazy(() => import("../pages/public/course-detail/CourseDetailPage"));
const AdminDashboardPage = lazy(() => import("../pages/admin/AdminDashboardPage"));
const ProfilePage = lazy(() => import("../pages/public/ProfilePage"));
const InstructorApplyPage = lazy(() => import("../pages/instructor/InstructorApplyPage"));
const AdminInstructorApplicationsPage = lazy(() => import("../pages/admin/AdminInstructorApplicationsPage"));
const InstructorCoursesPage = lazy(() => import("../pages/instructor/InstructorCoursesPage"));
const InstructorCourseDetailPage = lazy(() => import("../pages/instructor/InstructorCourseDetailPage"));
const InstructorCourseStudentsPage = lazy(() => import("../pages/instructor/InstructorCourseStudentsPage"));
const InstructorCourseAnalyticsPage = lazy(() => import("../pages/instructor/InstructorCourseAnalyticsPage"));
const InstructorCourseQAPage = lazy(() => import("../pages/instructor/InstructorCourseQAPage"));
const AdminCourseListPage = lazy(() => import("../pages/admin/AdminCourseListPage"));
const CourseBuilderPage = lazy(() => import("../pages/course-builder/CourseBuilderPage"));
const AdminCourseAssignPage = lazy(() => import("../pages/admin/AdminCourseAssignPage"));
const AdminCategoryPage = lazy(() => import("../pages/admin/AdminCategoryPage"));
const MyCoursesPage = lazy(() => import("../pages/student/MyCoursesPage"));
const MyLearningPage = lazy(() => import("../pages/student/MyLearningPage"));
const CertificatesPage = lazy(() => import("../pages/student/CertificatesPage"));
const StudentCourseQAPage = lazy(() => import("../pages/student/StudentCourseQAPage"));
const LearningPage = lazy(() => import("../pages/learning/LearningPage"));
const AdminReviewsPage = lazy(() => import("../pages/admin/AdminReviewsPage"));
const InstructorListPage = lazy(() => import("../pages/admin/InstructorListPage"));
const UserManagementPage = lazy(() => import("../pages/admin/UserManagementPage"));
const RoleManagePage = lazy(() => import("../pages/admin/RoleManagePage"));
const ActivityLogPage = lazy(() => import("../pages/admin/ActivityLogPage"));
const SystemSettingsPage = lazy(() => import("../pages/admin/SystemSettingsPage"));
const CheckoutPage = lazy(() => import("../pages/public/payment/CheckoutPage"));
const SuccessPage = lazy(() => import("../pages/public/payment/SuccessPage"));
const CancelPage = lazy(() => import("../pages/public/payment/CancelPage"));
const InstructorRevenuePage = lazy(() => import("../pages/instructor/InstructorRevenuePage"));
const FinanceTransactionsPage = lazy(() => import("../pages/admin/FinanceTransactionsPage"));
const FinanceRevenuePage = lazy(() => import("../pages/admin/FinanceRevenuePage"));
const FinanceReportsPage = lazy(() => import("../pages/admin/FinanceReportsPage"));
const FinancePayoutPage = lazy(() => import("../pages/admin/FinancePayoutPage"));
const SupportPage = lazy(() => import("../pages/support/SupportPage"));
const AdminRequestProcessingPage = lazy(() => import("../pages/admin/AdminRequestProcessingPage"));
const NotificationsPage = lazy(() => import("../pages/notification/NotificationsPage"));
const WishlistPage = lazy(() => import("../pages/student/WishlistPage"));
const CartPage = lazy(() => import("../pages/public/payment/CartPage"));
const AdminCouponPage = lazy(() => import("../pages/admin/AdminCouponPage"));
const NotFoundPage = lazy(() => import("../pages/public/NotFoundPage"));

function PageLoader() {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "40vh" }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Đang tải...</span>
      </div>
    </div>
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ======== PUBLIC ROUTES ======== */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Suspense fallback={<PageLoader />}><HomePage /></Suspense>} />
          <Route path="/courses" element={<Suspense fallback={<PageLoader />}><ErrorBoundary><CoursesPage /></ErrorBoundary></Suspense>} />
          <Route path="/courses/:courseId" element={<Suspense fallback={<PageLoader />}><ErrorBoundary><CourseDetailPage /></ErrorBoundary></Suspense>} />
          <Route path="/contact" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
          <Route path="/register" element={<Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>} />
          <Route path="/login" element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
          <Route path="/forgot-password" element={<Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense>} />
          <Route path="/verify-otp" element={<Suspense fallback={<PageLoader />}><VerifyotpPage /></Suspense>} />
          <Route path="/register/verify-otp" element={<Suspense fallback={<PageLoader />}><VerifyotpPage /></Suspense>} />
          <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense>} />
          <Route path="/instructor/apply" element={<Suspense fallback={<PageLoader />}><InstructorApplyPage /></Suspense>} />
          <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
        </Route>

        {/* ======== PAYMENT ROUTES (MainLayout, no auth) ======== */}
        <Route element={<MainLayout />}>
          <Route path="/payment/success" element={<Suspense fallback={<PageLoader />}><SuccessPage /></Suspense>} />
          <Route path="/payment/cancel" element={<Suspense fallback={<PageLoader />}><CancelPage /></Suspense>} />
        </Route>

        {/* ======== PROTECTED ROUTES ======== */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<ProtectedRoute allowedPermissions={["admin.dashboard.view"]}><Suspense fallback={<PageLoader />}><AdminDashboardPage /></Suspense></ProtectedRoute>} />
          <Route path="/my-courses" element={<ProtectedRoute allowedPermissions={["student.my_course.view"]}><Suspense fallback={<PageLoader />}><MyCoursesPage /></Suspense></ProtectedRoute>} />
          <Route path="/my-learning" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><MyLearningPage /></Suspense></ProtectedRoute>} />
          <Route path="/my-certificates" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><CertificatesPage /></Suspense></ProtectedRoute>} />
          <Route path="/courses/:courseId/learn" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><LearningPage /></Suspense></ProtectedRoute>} />
          <Route path="/courses/:courseId/learn/:lessonId" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><LearningPage /></Suspense></ProtectedRoute>} />
          <Route path="/courses/:courseId/qa" element={<ProtectedRoute allowedPermissions={["course.comment.create"]}><Suspense fallback={<PageLoader />}><StudentCourseQAPage /></Suspense></ProtectedRoute>} />
          <Route path="/courses/:courseId/checkout" element={<ProtectedRoute allowedPermissions={["student.course.buy"]}><Suspense fallback={<PageLoader />}><CheckoutPage /></Suspense></ProtectedRoute>} />
          <Route path="/admin/courses" element={<ProtectedRoute allowedPermissions={["course.course.view"]}><Suspense fallback={<PageLoader />}><AdminCourseListPage /></Suspense></ProtectedRoute>} />
          <Route path="/admin/courses/create" element={<ProtectedRoute allowedPermissions={["course.course.create"]}><Suspense fallback={<PageLoader />}><CourseBuilderPage mode="create" /></Suspense></ProtectedRoute>} />
          <Route path="/admin/courses/:courseId/edit" element={<ProtectedRoute allowedPermissions={["course.course.update"]}><Suspense fallback={<PageLoader />}><CourseBuilderPage mode="edit" /></Suspense></ProtectedRoute>} />
          <Route path="/admin/courses/:courseId/assign" element={<ProtectedRoute allowedPermissions={["course.instructor.assign"]}><Suspense fallback={<PageLoader />}><AdminCourseAssignPage /></Suspense></ProtectedRoute>} />
          <Route path="/admin/courses/categories" element={<ProtectedRoute allowedPermissions={["course.category.view"]}><Suspense fallback={<PageLoader />}><AdminCategoryPage /></Suspense></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute allowedPermissions={["course.review.view"]}><Suspense fallback={<PageLoader />}><AdminReviewsPage /></Suspense></ProtectedRoute>} />
          <Route path="/instructor/courses" element={<ProtectedRoute allowedPermissions={["instructor.course.view_own"]}><Suspense fallback={<PageLoader />}><InstructorCoursesPage /></Suspense></ProtectedRoute>} />
          <Route path="/instructor/courses/:courseId" element={<ProtectedRoute allowedPermissions={["instructor.course.view_own"]}><Suspense fallback={<PageLoader />}><InstructorCourseDetailPage /></Suspense></ProtectedRoute>} />
          <Route path="/instructor/courses/:courseId/students" element={<ProtectedRoute allowedPermissions={["instructor.course.view_own"]}><Suspense fallback={<PageLoader />}><InstructorCourseStudentsPage /></Suspense></ProtectedRoute>} />
          <Route path="/instructor/courses/:courseId/analytics" element={<ProtectedRoute allowedPermissions={["instructor.course.view_own"]}><Suspense fallback={<PageLoader />}><InstructorCourseAnalyticsPage /></Suspense></ProtectedRoute>} />
          <Route path="/instructor/courses/:courseId/qa" element={<ProtectedRoute allowedPermissions={["course.comment.reply"]}><Suspense fallback={<PageLoader />}><InstructorCourseQAPage /></Suspense></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedPermissions={["user.user.view"]}><Suspense fallback={<PageLoader />}><UserManagementPage /></Suspense></ProtectedRoute>} />
          <Route path="/admin/instructor-support" element={<ProtectedRoute allowedPermissions={["user.instructor.support"]}><Suspense fallback={<PageLoader />}><InstructorListPage /></Suspense></ProtectedRoute>} />
          <Route path="/admin/register-instructor" element={<ProtectedRoute allowedPermissions={["user.instructor.approve"]}><Suspense fallback={<PageLoader />}><AdminInstructorApplicationsPage /></Suspense></ProtectedRoute>} />
          <Route path="/admin/complaints" element={<ProtectedRoute allowedPermissions={["user.user.complaint_resolve"]}><Suspense fallback={<PageLoader />}><SupportPage /></Suspense></ProtectedRoute>} />
          <Route path="/finance/transactions" element={<ProtectedRoute allowedPermissions={["finance.finance.revenue_view"]}><Suspense fallback={<PageLoader />}><FinanceTransactionsPage /></Suspense></ProtectedRoute>} />
          <Route path="/finance/revenue" element={<ProtectedRoute allowedPermissions={["finance.finance.revenue_view"]}><Suspense fallback={<PageLoader />}><FinanceRevenuePage /></Suspense></ProtectedRoute>} />
          <Route path="/finance/reports" element={<ProtectedRoute allowedPermissions={["finance.finance.report_export"]}><Suspense fallback={<PageLoader />}><FinanceReportsPage /></Suspense></ProtectedRoute>} />
          <Route path="/finance/payouts" element={<ProtectedRoute allowedPermissions={["finance.finance.payout"]}><Suspense fallback={<PageLoader />}><FinancePayoutPage /></Suspense></ProtectedRoute>} />
          <Route path="/instructor/revenue" element={<ProtectedRoute allowedPermissions={["user.instructor.sales_history"]}><Suspense fallback={<PageLoader />}><InstructorRevenuePage /></Suspense></ProtectedRoute>} />
          <Route path="/super-admin/roles" element={<ProtectedRoute allowedPermissions={["admin.role.view"]}><Suspense fallback={<PageLoader />}><RoleManagePage /></Suspense></ProtectedRoute>} />
          <Route path="/super-admin/activity-logs" element={<ProtectedRoute allowedPermissions={["admin.dashboard.view"]}><Suspense fallback={<PageLoader />}><ActivityLogPage /></Suspense></ProtectedRoute>} />
          <Route path="/super-admin/settings" element={<ProtectedRoute allowedPermissions={["admin.dashboard.view"]}><Suspense fallback={<PageLoader />}><SystemSettingsPage /></Suspense></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute allowedPermissions={["support.request.create"]}><Suspense fallback={<PageLoader />}><SupportPage /></Suspense></ProtectedRoute>} />
          <Route path="/admin/requests" element={<ProtectedRoute allowedPermissions={["support.request.process"]}><Suspense fallback={<PageLoader />}><AdminRequestProcessingPage /></Suspense></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedPermissions={["student.profile.manage"]}><Suspense fallback={<PageLoader />}><ProfilePage /></Suspense></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense></ProtectedRoute>} />
          <Route path="/my-wishlist" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><WishlistPage /></Suspense></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><CartPage /></Suspense></ProtectedRoute>} />
          <Route path="/admin/coupons" element={<ProtectedRoute allowedPermissions={["finance.coupon.view"]}><Suspense fallback={<PageLoader />}><AdminCouponPage /></Suspense></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;