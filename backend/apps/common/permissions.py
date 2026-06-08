from rest_framework.permissions import BasePermission


class HasRequiredPermission(BasePermission):
    message = "Bạn không có quyền truy cập chức năng này."
    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False
        # Nếu người dùng có vai trò SUPERADMIN, cho phép truy cập mọi chức năng
        if user.role and user.role.code == "SUPERADMIN":
            return True
        
        required_permission = getattr(view, "required_permission", None)

        if required_permission is None:
            return False
        return user.role.permissions.filter(code=required_permission).exists()