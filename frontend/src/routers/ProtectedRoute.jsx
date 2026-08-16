import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { getRoleCode } from "../utils/permissions";

function ProtectedRoute({ children, allowedPermissions, allowedRoles }) {
  const { user, loading, isAuthenticated } = useUser();

  if (loading) {
    return <div className="text-center py-5">Đang tải...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRoleCode = getRoleCode(user);

  // SUPERADMIN luôn được phép truy cập mọi chức năng
  if (userRoleCode === "SUPERADMIN") {
    return children;
  }

  // Kiểm tra theo role (nếu có)
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRoleCode)) {
      return <Navigate to="/home" replace />;
    }
  }

  // Kiểm tra theo quyền
  if (allowedPermissions && allowedPermissions.length > 0) {
    const userPermissions = user?.permissions || [];
    const hasPermission = allowedPermissions.some(p => userPermissions.includes(p));
    if (!hasPermission) {
      return <Navigate to="/home" replace />;
    }
    return children;
  }

  // Nếu không có allowedPermissions & allowedRoles, cho phép truy cập
  return children;
}

export default ProtectedRoute;