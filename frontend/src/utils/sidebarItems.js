export const sidebarItems = [
  { type: "item", label: "Dashboard", path: "/dashboard", icon: "bi-grid", roles: ["SUPERADMIN"] },

  { type: "group", label: "Quản lý học tập" },
  { type: "item", label: "Khóa học", path: "/courses", icon: "bi-mortarboard", roles: ["STUDENT", "COURSE_ADMIN", "SUPERADMIN","INSTRUCTOR","INSTRUCTOR_MANAGER"] },
  { type: "item", label: "Khóa học của tôi", path: "/my-courses", icon: "bi-journal-bookmark", roles: ["STUDENT", "INSTRUCTOR"] },
  { type: "item", label: "Chứng chỉ của tôi", path: "/my-certificates", icon: "bi-award", roles: ["STUDENT", "INSTRUCTOR"] },

  // Admin courses
  { type: "item", label: "Quản lý khóa học", path: "/admin/courses", icon: "bi-tools", roles: ["COURSE_ADMIN", "SUPERADMIN"] },
  { type: "item", label: "Danh mục khóa học", path: "/admin/courses/categories", icon: "bi-folder", roles: ["COURSE_ADMIN", "SUPERADMIN"] },
  { type: "item", label: "Bình luận / Đánh giá", path: "/admin/reviews", icon: "bi-chat-square-text", roles: ["COURSE_ADMIN", "SUPERADMIN"] },

  // Instructor courses (view-only)
  { type: "item", label: "Khóa học giảng dạy", path: "/instructor/courses", icon: "bi-journal-bookmark", roles: ["INSTRUCTOR"] },
  { type: "item", label: "Doanh thu của tôi", path: "/instructor/revenue", icon: "bi-cash-coin", roles: ["INSTRUCTOR"] },

  { type: "group", label: "Người dùng & Giảng viên" },
  { type: "item", label: "Quản lý người dùng", path: "/admin/users", icon: "bi-people", roles: ["SUPERADMIN"] },
  { type: "item", label: "Danh sách giảng viên", path: "/admin/instructors", icon: "bi-person-badge", roles: ["INSTRUCTOR_MANAGER", "SUPERADMIN"] },
  { type: "item", label: "Hỗ trợ giảng viên", path: "/admin/instructor-support", icon: "bi-headset", roles: ["INSTRUCTOR_MANAGER"] },
  { type: "item", label: "Hồ sơ đăng ký giảng viên", path: "/admin/register-instructor", icon: "bi-file-earmark-person", roles: ["INSTRUCTOR_MANAGER", "SUPERADMIN"] },
  { type: "item", label: "Khiếu nại người dùng", path: "/admin/complaints", icon: "bi-exclamation-triangle", roles: ["USER_MANAGER","SUPERADMIN"] },

  { type: "group", label: "Tài chính" },
  { type: "item", label: "Doanh thu", path: "/finance/revenue", icon: "bi-cash-stack", roles: ["FINANCE_ADMIN"] },
  { type: "item", label: "Giao dịch", path: "/finance/transactions", icon: "bi-receipt", roles: ["FINANCE_ADMIN","SUPERADMIN"] },
  { type: "item", label: "Cấu hình phí", path: "/finance/fees", icon: "bi-gear", roles: ["SUPERADMIN"] },
  { type: "item", label: "Báo cáo tài chính", path: "/finance/reports", icon: "bi-file-earmark-bar-graph", roles: ["FINANCE_ADMIN"] },

  { type: "group", label: "Super Admin" },
  { type: "item", label: "Quản lý admin", path: "/super-admin/admins", icon: "bi-person-gear", roles: ["SUPERADMIN"] },
  { type: "item", label: "Quản lý role", path: "/super-admin/roles", icon: "bi-shield-lock", roles: ["SUPERADMIN"] },
  { type: "item", label: "Quản lý permission", path: "/super-admin/permissions", icon: "bi-key", roles: ["SUPERADMIN"] },
  { type: "item", label: "Gán quyền cho role", path: "/super-admin/role-permissions", icon: "bi-diagram-3", roles: ["SUPERADMIN"] },
  { type: "item", label: "Nhật ký hoạt động", path: "/super-admin/activity-logs", icon: "bi-clock-history", roles: ["SUPERADMIN"] },
  { type: "item", label: "Cấu hình hệ thống", path: "/super-admin/settings", icon: "bi-sliders", roles: ["SUPERADMIN"] },

  { type: "group", label: "Tài khoản" },
  { type: "item", label: "Thông báo", path: "/notifications", icon: "bi-bell", roles: ["STUDENT", "INSTRUCTOR", "COURSE_ADMIN", "INSTRUCTOR_MANAGER", "USER_MANAGER", "FINANCE_ADMIN", "SUPERADMIN"] },
  { type: "item", label: "Hồ sơ cá nhân", path: "/profile", icon: "bi-person-circle", roles: ["STUDENT", "INSTRUCTOR", "COURSE_ADMIN", "INSTRUCTOR_MANAGER", "USER_MANAGER", "FINANCE_ADMIN", "SUPERADMIN"] },
];
