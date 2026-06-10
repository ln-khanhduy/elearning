import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useUser();

  if (loading) {
    return <div className="text-center py-5">Đang tải...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Lấy role code: có thể là string "STUDENT" hoặc object {code: "STUDENT"}
  const getRoleCode = (role) => {
    if (!role) return null;
    if (typeof role === "string") return role;
    if (typeof role === "object" && role?.code) return role.code;
    return null;
  };

  const userRoleCode = getRoleCode(user?.role);

  if (allowedRoles && !allowedRoles.includes(userRoleCode)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default ProtectedRoute;
