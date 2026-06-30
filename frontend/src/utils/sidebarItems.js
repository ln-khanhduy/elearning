export const sidebarItems = [
  { type: "item", label: "Dashboard", path: "/dashboard", icon: "bi-grid", requiredPermissions: ["admin.dashboard.view"] },

  { type: "group", label: "Quản lý học tập" },
  { type: "item", label: "Khóa học", path: "/courses", icon: "bi-mortarboard", requiredPermissions: ["student.course.search"] },
  { type: "item", label: "Khóa học của tôi", path: "/my-courses", icon: "bi-journal-bookmark", requiredPermissions: ["student.my_course.view"] },
  { type: "item", label: "Chứng chỉ của tôi", path: "/my-certificates", icon: "bi-award", requiredPermissions: ["student.learning.view"] },

  // Admin courses
  { type: "item", label: "Quản lý khóa học", path: "/admin/courses", icon: "bi-tools", requiredPermissions: ["course.course.view"] },
  { type: "item", label: "Danh mục khóa học", path: "/admin/courses/categories", icon: "bi-folder", requiredPermissions: ["course.category.view"] },
  { type: "item", label: "Bình luận / Đánh giá", path: "/admin/reviews", icon: "bi-chat-square-text", requiredPermissions: ["course.review.view"] },

  // Instructor courses
  { type: "item", label: "Khóa học giảng dạy", path: "/instructor/courses", icon: "bi-journal-bookmark", requiredPermissions: ["instructor.course.view_own"] },
  { type: "item", label: "Doanh thu của tôi", path: "/instructor/revenue", icon: "bi-cash-coin", requiredPermissions: ["instructor.wallet.view_balance"] },

  { type: "group", label: "Người dùng & Giảng viên" },
  { type: "item", label: "Quản lý người dùng", path: "/admin/users", icon: "bi-people", requiredPermissions: ["user.user.view"] },
  { type: "item", label: "Danh sách giảng viên", path: "/admin/instructors", icon: "bi-person-badge", requiredPermissions: ["user.instructor.view"] },
  { type: "item", label: "Hỗ trợ giảng viên", path: "/admin/instructor-support", icon: "bi-headset", requiredPermissions: ["user.instructor.support"] },
  { type: "item", label: "Hồ sơ đăng ký giảng viên", path: "/admin/register-instructor", icon: "bi-file-earmark-person", requiredPermissions: ["user.instructor.view"] },
  { type: "item", label: "Khiếu nại người dùng", path: "/admin/complaints", icon: "bi-exclamation-triangle", requiredPermissions: ["user.user.complaint_resolve"] },

  { type: "group", label: "Tài chính" },
  { type: "item", label: "Doanh thu", path: "/finance/revenue", icon: "bi-cash-stack", requiredPermissions: ["finance.finance.revenue_view"] },
  { type: "item", label: "Giao dịch", path: "/finance/transactions", icon: "bi-receipt", requiredPermissions: ["finance.finance.revenue_view"] },
  { type: "item", label: "Cấu hình phí", path: "/finance/fees", icon: "bi-gear", requiredPermissions: ["finance.finance.fee_config"] },
  { type: "item", label: "Báo cáo tài chính", path: "/finance/reports", icon: "bi-file-earmark-bar-graph", requiredPermissions: ["finance.finance.report_export"] },

  { type: "group", label: "Super Admin" },
  { type: "item", label: "Quản lý admin", path: "/super-admin/admins", icon: "bi-person-gear", requiredPermissions: ["admin.admin.view"] },
  { type: "item", label: "Quản lý role", path: "/super-admin/roles", icon: "bi-shield-lock", requiredPermissions: ["admin.role.view"] },
  { type: "item", label: "Quản lý permission", path: "/super-admin/permissions", icon: "bi-key", requiredPermissions: ["admin.role.view"] },
  { type: "item", label: "Gán quyền cho role", path: "/super-admin/role-permissions", icon: "bi-diagram-3", requiredPermissions: ["admin.role.assign_permission"] },
  { type: "item", label: "Nhật ký hoạt động", path: "/super-admin/activity-logs", icon: "bi-clock-history", requiredPermissions: ["admin.dashboard.view"] },
  { type: "item", label: "Cấu hình hệ thống", path: "/super-admin/settings", icon: "bi-sliders", requiredPermissions: ["admin.dashboard.view"] },

  { type: "group", label: "Tài khoản" },
  { type: "item", label: "Thông báo", path: "/notifications", icon: "bi-bell" },
  { type: "item", label: "Hồ sơ cá nhân", path: "/profile", icon: "bi-person-circle" },
];
