/**
 * Bảng ánh xạ tập trung route -> quyền.
 * Là nguồn dữ liệu duy nhất được dùng bởi cả AppRouter và Sidebar
 * để tránh lệch quyền giữa thanh bên và route.
 */
export const ROUTE_PERMISSIONS = {
  "/dashboard": ["admin.dashboard.view"],
  "/courses": ["student.course.search"],
  "/my-courses": ["student.my_course.view"],
  "/courses/:courseId/qa": ["course.comment.create"],
  "/courses/:courseId/checkout": ["student.course.buy"],
  "/admin/courses": ["course.course.view"],
  "/admin/courses/create": ["course.course.create"],
  "/admin/courses/:courseId/edit": ["course.course.update"],
  "/admin/courses/:courseId/assign": ["course.instructor.assign"],
  "/admin/courses/categories": ["course.category.view"],
  "/admin/reviews": ["course.review.view"],
  "/admin/users": ["user.user.view"],
  "/admin/instructor-support": ["user.instructor.support"],
  "/admin/register-instructor": ["user.instructor.approve"],
  "/instructor/courses": ["instructor.course.view_own"],
  "/instructor/courses/:courseId": ["instructor.course.view_own"],
  "/instructor/courses/:courseId/students": ["instructor.course.view_own"],
  "/instructor/courses/:courseId/analytics": ["instructor.course.view_own"],
  "/instructor/courses/:courseId/qa": ["course.comment.reply"],
  "/instructor/revenue": ["user.instructor.sales_history"],
  "/finance/transactions": ["finance.finance.revenue_view"],
  "/finance/revenue": ["finance.finance.revenue_view"],
  "/finance/reports": ["finance.finance.report_export"],
  "/finance/payouts": ["finance.finance.payout"],
  "/admin/coupons": ["finance.coupon.view"],
  "/super-admin/roles": ["admin.role.view"],
  "/super-admin/activity-logs": ["admin.dashboard.view"],
  "/super-admin/settings": ["admin.dashboard.view"],
  "/support": ["support.request.create"],
  "/admin/requests": ["support.request.process"],
  "/admin/complaints": ["user.user.complaint_resolve"],
  // Lưu ý: /profile không cần permission — mọi người dùng đã đăng nhập đều truy cập được
};

/** Lấy danh sách quyền tương ứng với đường dẫn route */
export const getRoutePermissions = (path) => ROUTE_PERMISSIONS[path] || null;

/** Các quyền đặc biệt SUPERADMIN có thể bypass */
const SUPERADMIN_ROLE_CODE = "SUPERADMIN";

/**
 * Lấy mã vai trò của user.
 * Role có thể là string "STUDENT" hoặc object { code: "STUDENT" }.
 */
export const getRoleCode = (user) => {
  if (!user?.role) return null;
  if (typeof user.role === "string") return user.role;
  if (typeof user.role === "object" && user.role?.code) return user.role.code;
  return null;
};

/**
 * Kiểm tra user có một quyền cụ thể hay không.
 * SUPERADMIN luôn được xem là có tất cả quyền.
 *  user - Đối tượng user từ context
 *  permissionCode - Mã quyền cần kiểm tra (VD: "student.cart.view")
 */
export const hasPermission = (user, permissionCode) => {
  if (!user) return false;
  if (getRoleCode(user) === SUPERADMIN_ROLE_CODE) return true;
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  return permissions.includes(permissionCode);
};


//Kiểm tra user có ít nhất một trong các quyền đã cho.

export const hasAnyPermission = (user, permissionCodes = []) => {
  return permissionCodes.some((code) => hasPermission(user, code));
};