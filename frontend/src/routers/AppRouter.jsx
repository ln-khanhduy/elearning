import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import MainLayout from "../components/layout/MainLayout"
import ProtectedRoute from "./ProtectedRoute";
import ErrorBoundary from "../components/common/ErrorBoundary";
import { getRoutePermissions } from "../utils/permissions";

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

/** Lazy page wrapper with Suspense + ErrorBoundary */
const Page = ({ children }) => (
  <Suspense fallback={<PageLoader />}>
    <ErrorBoundary>{children}</ErrorBoundary>
  </Suspense>
);

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ======== PUBLIC ROUTES ======== */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Page><HomePage /></Page>} />
          <Route path="/courses" element={<Page><CoursesPage /></Page>} />
          <Route path="/courses/:courseId" element={<Page><CourseDetailPage /></Page>} />
          <Route path="/contact" element={<Page><ContactPage /></Page>} />
          <Route path="/register" element={<Page><RegisterPage /></Page>} />
          <Route path="/login" element={<Page><LoginPage /></Page>} />
          <Route path="/forgot-password" element={<Page><ForgotPasswordPage /></Page>} />
          <Route path="/verify-otp" element={<Page><VerifyotpPage /></Page>} />
          <Route path="/register/verify-otp" element={<Page><VerifyotpPage /></Page>} />
          <Route path="/reset-password" element={<Page><ResetPasswordPage /></Page>} />
          <Route path="/instructor/apply" element={<Page><InstructorApplyPage /></Page>} />
        </Route>

        {/* ======== PAYMENT ROUTES (MainLayout, no auth) ======== */}
        <Route element={<MainLayout />}>
          <Route path="/payment/success" element={<Page><SuccessPage /></Page>} />
          <Route path="/payment/cancel" element={<Page><CancelPage /></Page>} />
        </Route>

        {/* ======== PROTECTED ROUTES ======== */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/dashboard")}><Page><AdminDashboardPage /></Page></ProtectedRoute>} />
          <Route path="/my-courses" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/my-courses")}><Page><MyCoursesPage /></Page></ProtectedRoute>} />
          <Route path="/my-learning" element={<ProtectedRoute><Page><MyLearningPage /></Page></ProtectedRoute>} />
          <Route path="/my-certificates" element={<ProtectedRoute><Page><CertificatesPage /></Page></ProtectedRoute>} />
          <Route path="/courses/:courseId/learn" element={<ProtectedRoute><Page><LearningPage /></Page></ProtectedRoute>} />
          <Route path="/courses/:courseId/learn/:lessonId" element={<ProtectedRoute><Page><LearningPage /></Page></ProtectedRoute>} />
          <Route path="/courses/:courseId/qa" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/courses/:courseId/qa")}><Page><StudentCourseQAPage /></Page></ProtectedRoute>} />
          <Route path="/courses/:courseId/checkout" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/courses/:courseId/checkout")}><Page><CheckoutPage /></Page></ProtectedRoute>} />
          <Route path="/admin/courses" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/admin/courses")}><Page><AdminCourseListPage /></Page></ProtectedRoute>} />
          <Route path="/admin/courses/create" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/admin/courses/create")}><Page><CourseBuilderPage mode="create" /></Page></ProtectedRoute>} />
          <Route path="/admin/courses/:courseId/edit" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/admin/courses/:courseId/edit")}><Page><CourseBuilderPage mode="edit" /></Page></ProtectedRoute>} />
          <Route path="/admin/courses/:courseId/assign" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/admin/courses/:courseId/assign")}><Page><AdminCourseAssignPage /></Page></ProtectedRoute>} />
          <Route path="/admin/courses/categories" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/admin/courses/categories")}><Page><AdminCategoryPage /></Page></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/admin/reviews")}><Page><AdminReviewsPage /></Page></ProtectedRoute>} />
          <Route path="/instructor/courses" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/instructor/courses")}><Page><InstructorCoursesPage /></Page></ProtectedRoute>} />
          <Route path="/instructor/courses/:courseId" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/instructor/courses/:courseId")}><Page><InstructorCourseDetailPage /></Page></ProtectedRoute>} />
          <Route path="/instructor/courses/:courseId/students" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/instructor/courses/:courseId/students")}><Page><InstructorCourseStudentsPage /></Page></ProtectedRoute>} />
          <Route path="/instructor/courses/:courseId/analytics" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/instructor/courses/:courseId/analytics")}><Page><InstructorCourseAnalyticsPage /></Page></ProtectedRoute>} />
          <Route path="/instructor/courses/:courseId/qa" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/instructor/courses/:courseId/qa")}><Page><InstructorCourseQAPage /></Page></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/admin/users")}><Page><UserManagementPage /></Page></ProtectedRoute>} />
          <Route path="/admin/instructor-support" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/admin/instructor-support")}><Page><InstructorListPage /></Page></ProtectedRoute>} />
          <Route path="/admin/register-instructor" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/admin/register-instructor")}><Page><AdminInstructorApplicationsPage /></Page></ProtectedRoute>} />
          <Route path="/admin/complaints" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/admin/complaints")}><Page><SupportPage /></Page></ProtectedRoute>} />
          <Route path="/finance/transactions" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/finance/transactions")}><Page><FinanceTransactionsPage /></Page></ProtectedRoute>} />
          <Route path="/finance/revenue" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/finance/revenue")}><Page><FinanceRevenuePage /></Page></ProtectedRoute>} />
          <Route path="/finance/reports" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/finance/reports")}><Page><FinanceReportsPage /></Page></ProtectedRoute>} />
          <Route path="/finance/payouts" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/finance/payouts")}><Page><FinancePayoutPage /></Page></ProtectedRoute>} />
          <Route path="/instructor/revenue" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/instructor/revenue")}><Page><InstructorRevenuePage /></Page></ProtectedRoute>} />
          <Route path="/super-admin/roles" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/super-admin/roles")}><Page><RoleManagePage /></Page></ProtectedRoute>} />
          <Route path="/super-admin/activity-logs" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/super-admin/activity-logs")}><Page><ActivityLogPage /></Page></ProtectedRoute>} />
          <Route path="/super-admin/settings" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/super-admin/settings")}><Page><SystemSettingsPage /></Page></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/support")}><Page><SupportPage /></Page></ProtectedRoute>} />
          <Route path="/admin/requests" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/admin/requests")}><Page><AdminRequestProcessingPage /></Page></ProtectedRoute>} />
          {/* /profile: mọi người dùng đã đăng nhập đều truy cập được (không yêu cầu permission) */}
          <Route path="/profile" element={<ProtectedRoute><Page><ProfilePage /></Page></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Page><NotificationsPage /></Page></ProtectedRoute>} />
          <Route path="/my-wishlist" element={<ProtectedRoute><Page><WishlistPage /></Page></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><Page><CartPage /></Page></ProtectedRoute>} />
          <Route path="/admin/coupons" element={<ProtectedRoute allowedPermissions={getRoutePermissions("/admin/coupons")}><Page><AdminCouponPage /></Page></ProtectedRoute>} />
        </Route>

        {/* ======== FALLBACK ROUTE (luôn ở cuối cùng) ======== */}
        <Route element={<PublicLayout />}>
          <Route path="*" element={<Page><NotFoundPage /></Page>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;