/**
 * Bảng ánh xạ tập trung route -> quyền.
 * Là nguồn dữ liệu duy nhất được dùng bởi cả AppRouter và Sidebar
 * để tránh lệch quyền giữa thanh bên và route.
 */
export const ROUTE_PERMISSIONS = {
  "/dashboard": ["admin.dashboard.view"],
  "/courses": ["student.my_course.view"],
  "/my-courses": ["student.my_course.view"],
  "/my-wishlist": ["student.wishlist.view"],
  "/cart": ["student.cart.view"],
  "/courses/:courseId/checkout": ["student.course.buy"],
  "/admin/courses/create": ["course.course.manage"],
  "/admin/courses/:courseId/edit": ["course.course.manage"],
  "/admin/courses/:courseId/assign": ["course.instructor.assign"],
  "/admin/users": ["user.user.view"],
  "/admin/instructor-support": ["user.instructor.view"],
  "/admin/register-instructor": ["user.instructor.view"],
  "/instructor/courses": ["instructor.course.view_own"],
  "/instructor/courses/:courseId": ["instructor.course.view_own"],
  "/instructor/courses/:courseId/students": ["instructor.course.view_own"],
  "/instructor/courses/:courseId/analytics": ["instructor.course.view_own"],
  "/finance/transactions": ["finance.finance.revenue_view"],
  "/finance/revenue": ["finance.finance.revenue_view"],
  "/finance/reports": ["finance.finance.revenue_view"],
  "/finance/refunds": ["finance.finance.refund"],
  "/admin/coupons": ["finance.coupon.view"],
  "/super-admin/roles": ["admin.role.view"],
  "/super-admin/activity-logs": ["admin.dashboard.view"],
  "/super-admin/settings": ["admin.dashboard.view"],
  "/support": ["support.request.create"],
  "/admin/requests": ["support.request.process"],
  "/admin/complaints": ["support.request.process"],
};

/** Lấy danh sách quyền tương ứng với đường dẫn route */
export const getRoutePermissions = (path) => ROUTE_PERMISSIONS[path] || null;

/** Các quyền đặc biệt SUPERADMIN có thể bypass */
const SUPERADMIN_ROLE_CODE = "SUPERADMIN";

/** Các role được phép dùng tính năng học viên (mua khóa, học tập, chứng chỉ...) */
export const STUDENT_ROLES = ["STUDENT", "SUPERADMIN","INSTRUCTOR"];

/** Các role được phép dùng tính năng giảng viên tự quản (khóa học giảng dạy, lịch trực, lương...) */
export const INSTRUCTOR_ROLES = ["INSTRUCTOR", "SUPERADMIN"];

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

/** Kiểm tra user thuộc nhóm role học viên */
export const hasStudentRole = (user) => STUDENT_ROLES.includes(getRoleCode(user));

/** Kiểm tra user thuộc nhóm role giảng viên */
export const hasInstructorRole = (user) => INSTRUCTOR_ROLES.includes(getRoleCode(user));

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

// Kiểm tra user có ít nhất một trong các quyền đã cho.
export const hasAnyPermission = (user, permissionCodes = []) => {
  return permissionCodes.some((code) => hasPermission(user, code));
};