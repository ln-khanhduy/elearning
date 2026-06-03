from rest_framework.permissions import BasePermission
from common.rbac import user_has_permission

class HasRolePermission(BasePermission):
    message="Bạn không có quyền truy cập vào chức năng này"
    def has_permission(self,request,view):
        require_permission=getattr(view,"require_permission",None)
        if not require_permission:
            return False
        return user_has_permission(request.user,require_permission)