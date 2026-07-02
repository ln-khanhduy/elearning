import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

function ProtectedRoute({ children, allowedPermissions }) {
  const { user, loading, isAuthenticated } = useUser();

  if (loading) {
    return <div className="text-center py-5">Đang tải...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Lay role code tu user
  const getRoleCode = (role) => {
    if (!role) return null;
    if (typeof role === "string") return role;
    if (typeof role === "object" && role?.code) return role.code;
    return null;
  };

  const userRoleCode = getRoleCode(user?.role);

  // SUPERADMIN luon duoc phep truy cap moi chuc nang
  if (userRoleCode === "SUPERADMIN") {
    return children;
  }

  // Kiem tra theo permission
  if (allowedPermissions && allowedPermissions.length > 0) {
    const userPermissions = user?.permissions || [];
    const hasPermission = allowedPermissions.some(p => userPermissions.includes(p));
    if (!hasPermission) {
      return <Navigate to="/home" replace />;
    }
    return children;
  }

  // Neu khong co allowedPermissions, cho phep truy cap
  return children;
}

export default ProtectedRoute;
