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

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default ProtectedRoute;
