import { getRoutePermissions } from "./permissions";

export const sidebarItems = [
  { type: "item", label: "Dashboard", path: "/dashboard", icon: "bi-grid", requiredPermissions: getRoutePermissions("/dashboard") },

  { type: "group", label: "Quản lý học tập" },
  { type: "item", label: "Khóa học", path: "/courses", icon: "bi-mortarboard", requiredPermissions: getRoutePermissions("/courses") },
  { type: "item", label: "Trung tâm học tập", path: "/my-learning", icon: "bi-play-circle" },
  { type: "item", label: "Khóa học của tôi", path: "/my-courses", icon: "bi-journal-bookmark", requiredPermissions: getRoutePermissions("/my-courses") },
  { type: "item", label: "Yêu thích", path: "/my-wishlist", icon: "bi-heart" },
  { type: "item", label: "Giỏ hàng", path: "/cart", icon: "bi-cart3" },
  { type: "item", label: "Chứng chỉ của tôi", path: "/my-certificates", icon: "bi-award" },

  // Quản trị khóa học
  { type: "item", label: "Quản lý khóa học", path: "/admin/courses", icon: "bi-tools", requiredPermissions: getRoutePermissions("/admin/courses") },
  { type: "item", label: "Danh mục khóa học", path: "/admin/courses/categories", icon: "bi-folder", requiredPermissions: getRoutePermissions("/admin/courses/categories") },

  // Khóa học của giảng viên
  { type: "item", label: "Khóa học giảng dạy", path: "/instructor/courses", icon: "bi-journal-bookmark", requiredPermissions: getRoutePermissions("/instructor/courses") },
  { type: "item", label: "Doanh thu của tôi", path: "/instructor/revenue", icon: "bi-cash-coin", requiredPermissions: getRoutePermissions("/instructor/revenue") },

  { type: "group", label: "Người dùng & Giảng viên" },
  { type: "item", label: "Quản lý người dùng", path: "/admin/users", icon: "bi-people", requiredPermissions: getRoutePermissions("/admin/users") },
  { type: "item", label: "Hồ sơ đăng ký giảng viên", path: "/admin/register-instructor", icon: "bi-file-earmark-person", requiredPermissions: getRoutePermissions("/admin/register-instructor") },

  { type: "group", label: "Tài chính" },
  { type: "item", label: "Mã giảm giá", path: "/admin/coupons", icon: "bi-ticket-perforated", requiredPermissions: getRoutePermissions("/admin/coupons") },
  { type: "item", label: "Doanh thu", path: "/finance/revenue", icon: "bi-cash-stack", requiredPermissions: getRoutePermissions("/finance/revenue") },
  { type: "item", label: "Giao dịch", path: "/finance/transactions", icon: "bi-receipt", requiredPermissions: getRoutePermissions("/finance/transactions") },
  { type: "item", label: "Báo cáo tài chính", path: "/finance/reports", icon: "bi-file-earmark-bar-graph", requiredPermissions: getRoutePermissions("/finance/reports") },
  { type: "item", label: "Thanh toán GV", path: "/finance/payouts", icon: "bi-cash-stack", requiredPermissions: getRoutePermissions("/finance/payouts") },

  { type: "group", label: "Super Admin" },
  { type: "item", label: "Role & Permission", path: "/super-admin/roles", icon: "bi-shield-lock", requiredPermissions: getRoutePermissions("/super-admin/roles") },
  { type: "item", label: "Nhật ký hoạt động", path: "/super-admin/activity-logs", icon: "bi-clock-history", requiredPermissions: getRoutePermissions("/super-admin/activity-logs") },
  { type: "item", label: "Cấu hình hệ thống", path: "/super-admin/settings", icon: "bi-sliders", requiredPermissions: getRoutePermissions("/super-admin/settings") },

  { type: "group", label: "Hỗ trợ" },
  { type: "item", label: "Hỗ trợ & Yêu cầu", path: "/support", icon: "bi-headset", requiredPermissions: getRoutePermissions("/support") },
  { type: "item", label: "Xử lý yêu cầu", path: "/admin/requests", icon: "bi-inbox", requiredPermissions: getRoutePermissions("/admin/requests") },

  { type: "group", label: "Tài khoản" },
  { type: "item", label: "Thông báo", path: "/notifications", icon: "bi-bell" },
  { type: "item", label: "Hồ sơ cá nhân", path: "/profile", icon: "bi-person-circle", requiredPermissions: getRoutePermissions("/profile") },
];