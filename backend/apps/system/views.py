import json
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.common.base_api_view import BasePermissionAPIView
from apps.system.services import admin_log_service
from apps.system.serializers.dashboard_serializer import DashboardDataSerializer
from apps.system.services import dashboard_service
from apps.system.services import admin_user_service
from apps.system.serializers.admin_user_serializer import (
    AdminUserListSerializer,
    AdminUserToggleActiveSerializer,
    AdminUserChangeRoleSerializer,
)
from apps.users.repositories import user_repository


def success_response(data=None, message="Success", http_status=status.HTTP_200_OK):
    return Response({
        "success": True,
        "message": message,
        "data": data,
    }, status=http_status)


def error_response(message="Error", errors=None, http_status=status.HTTP_400_BAD_REQUEST):
    return Response({
        "success": False,
        "message": message,
        "errors": errors or {},
    }, status=http_status)


# ==================== DASHBOARD ====================


class AdminDashboardView(BasePermissionAPIView):
    required_permission = "admin.dashboard.view"

    def get(self, request):
        year = request.query_params.get("year")
        if year:
            try:
                year = int(year)
            except (ValueError, TypeError):
                year = None
        data = dashboard_service.get_dashboard_data(year)
        serializer = DashboardDataSerializer(data)
        admin_log_service.log(admin=request.user, action_type='DASHBOARD_VIEW', detail=f"Admin {request.user.email} đã xem dashboard")
        return Response(serializer.data)


# ==================== ADMIN USER MANAGEMENT ====================


class AdminUserListAPIView(BasePermissionAPIView):
    required_permission = "user.user.view"

    def get(self, request):
        search = request.query_params.get("search", "").strip()
        role_filter = request.query_params.get("role", "all")
        status_filter = request.query_params.get("status", "all")
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 10))

        if role_filter not in ("all", "student", "instructor"):
            role_filter = "all"
        if status_filter not in ("active", "locked", "all"):
            status_filter = "all"

        result = admin_user_service.get_user_list(
            requesting_user=request.user,
            search=search if search else None,
            role=role_filter if role_filter != "all" else None,
            status=status_filter if status_filter != "all" else None,
            page=page,
            page_size=page_size,
        )
        serializer = AdminUserListSerializer(result["results"], many=True)
        return success_response({
            "results": serializer.data,
            "total": result["total"],
            "page": result["page"],
            "page_size": result["page_size"],
            "total_pages": result["total_pages"],
        })


class AdminUserDetailAPIView(BasePermissionAPIView):
    required_permission = "user.user.view"

    def get(self, request, user_id):
        user = user_repository.get_user_by_id(user_id)
        if not admin_user_service.can_manage_user(request.user, user):
            return error_response("Bạn không có quyền xem người dùng này.", http_status=status.HTTP_403_FORBIDDEN)
        serializer = AdminUserListSerializer(user)
        return success_response(serializer.data)


class AdminUserToggleActiveAPIView(BasePermissionAPIView):
    required_permission = "user.user.lock"

    def patch(self, request, user_id):
        target_user = user_repository.get_user_by_id(user_id)
        if not admin_user_service.can_manage_user(request.user, target_user):
            return error_response("Bạn không có quyền thao tác với người dùng này.", http_status=status.HTTP_403_FORBIDDEN)
        reason = request.data.get("reason", "")
        try:
            from apps.users.services import user_management_service
            user, message = user_management_service.toggle_user_active(target_user, request.user, reason)
            resp_serializer = AdminUserToggleActiveSerializer({
                "id": user.id, "is_active": user.is_active, "message": message,
            })
            admin_log_service.log(
                admin=request.user,
                action_type='USER_LOCK' if not user.is_active else 'USER_UNLOCK',
                detail=f"{request.user.email} đã {'khóa' if not user.is_active else 'mở khóa'} tài khoản {user.email}",
                target_id=str(user.id), target_type='User',
            )
            return success_response(resp_serializer.data, message)
        except Exception as e:
            return error_response(str(e.detail) if hasattr(e, "detail") else str(e), http_status=status.HTTP_400_BAD_REQUEST)


# ==================== ACTIVITY LOG ====================


class ActivityLogListAPIView(BasePermissionAPIView):
    """GET /api/admin/activity-logs/ - Danh sách nhật ký hoạt động."""
    required_permission = "admin.dashboard.view"

    def get(self, request):
        from apps.system.services import activity_log_service
        action_type = request.query_params.get("action_type")
        date = request.query_params.get("date")
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))

        result = activity_log_service.get_logs(
            action_type=action_type or None,
            date=date or None,
            page=page,
            page_size=page_size,
        )

        items = []
        for log in result["results"]:
            items.append({
                "id": log.id,
                "admin_email": log.admin.email if log.admin else "N/A",
                "admin_name": log.admin.get_full_name() if log.admin else "N/A",
                "action_type": log.action_type,
                "target_type": log.target_type,
                "target_id": log.target_id,
                "detail": log.detail,
                "created_at": log.created_at.isoformat(),
            })

        return success_response({
            "results": items,
            "total": result["total"],
            "page": result["page"],
            "page_size": result["page_size"],
            "total_pages": result["total_pages"],
        })


class ActivityLogActionTypesAPIView(BasePermissionAPIView):
    """GET /api/admin/activity-logs/action-types/ - Danh sách loại hành động."""
    required_permission = "admin.dashboard.view"

    def get(self, request):
        from apps.system.services import activity_log_service
        types = activity_log_service.get_action_types()
        return success_response(list(types))


# ==================== SYSTEM CONFIG ====================


class SystemConfigListAPIView(BasePermissionAPIView):
    """GET /api/admin/configs/ - Lấy tất cả cấu hình hệ thống."""
    required_permission = "admin.dashboard.view"

    def get(self, request):
        from apps.system.services import system_config_service
        configs = system_config_service.get_all_configs()
        return success_response(configs)


class SystemConfigUpdateAPIView(BasePermissionAPIView):
    """PUT /api/admin/configs/ - Cập nhật cấu hình hệ thống."""
    required_permission = "admin.dashboard.view"

    def put(self, request):
        from apps.system.services import system_config_service
        configs = request.data.get("configs", {})
        if not configs:
            return error_response("Vui lòng gửi configs.", http_status=status.HTTP_400_BAD_REQUEST)
        try:
            results = system_config_service.update_configs(configs, updated_by=request.user.email)
            admin_log_service.log(
                admin=request.user, action_type='SYSTEM_CONFIG_UPDATE',
                detail=f"{request.user.email} đã cập nhật cấu hình hệ thống",
            )
            return success_response(results, "Cập nhật cấu hình thành công.")
        except Exception as e:
            return error_response(str(e.detail) if hasattr(e, "detail") else str(e), http_status=status.HTTP_400_BAD_REQUEST)


class AdminUserChangeRoleAPIView(BasePermissionAPIView):
    required_permission = "admin.admin.change_role"

    def patch(self, request, user_id):
        if not admin_user_service.can_assign_role(request.user):
            return error_response("Bạn không có quyền thay đổi role.", http_status=status.HTTP_403_FORBIDDEN)
        serializer = AdminUserChangeRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        from apps.users.services import user_service
        user = user_service.change_role(user_id, serializer.validated_data["role_id"])
        admin_log_service.log(
            admin=request.user, action_type='USER_CHANGE_ROLE',
            detail=f"{request.user.email} đã đổi role của {user.email}",
            target_id=str(user.id), target_type='User',
        )
        return success_response(AdminUserListSerializer(user).data, "Đổi role thành công.")


# ==================== ROLE MANAGEMENT ====================


class RoleListAPIView(BasePermissionAPIView):
    """GET /api/admin/roles/ - Danh sách roles."""
    required_permission = "admin.role.view"

    def get(self, request):
        from apps.system.services import role_service
        from apps.system.serializers.role_serializer import RoleSerializer
        roles = role_service.get_roles()
        serializer = RoleSerializer(roles, many=True)
        return success_response(serializer.data)


class RoleCreateAPIView(BasePermissionAPIView):
    """POST /api/admin/roles/ - Tạo role mới."""
    required_permission = "admin.role.create"

    def post(self, request):
        from apps.system.services import role_service
        from apps.system.serializers.role_serializer import RoleCreateUpdateSerializer
        serializer = RoleCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            role = role_service.create_role(**serializer.validated_data)
            admin_log_service.log(
                admin=request.user, action_type='ROLE_CREATE',
                detail=f"{request.user.email} đã tạo role {role.code}",
                target_id=str(role.id), target_type='Role',
            )
            from apps.system.serializers.role_serializer import RoleSerializer
            return success_response(RoleSerializer(role).data, "Tạo role thành công.", status.HTTP_201_CREATED)
        except Exception as e:
            return error_response(str(e.detail) if hasattr(e, "detail") else str(e), http_status=status.HTTP_400_BAD_REQUEST)


class RoleDetailAPIView(BasePermissionAPIView):
    """GET /api/admin/roles/{id}/ - Chi tiết role."""
    required_permission = "admin.role.view"

    def get(self, request, role_id):
        from apps.system.services import role_service
        from apps.system.serializers.role_serializer import RoleSerializer
        try:
            role = role_service.get_role_detail(role_id)
            return success_response(RoleSerializer(role).data)
        except Exception as e:
            return error_response(str(e.detail) if hasattr(e, "detail") else str(e), http_status=status.HTTP_404_NOT_FOUND)


class RoleUpdateAPIView(BasePermissionAPIView):
    """PATCH /api/admin/roles/{id}/ - Cập nhật role."""
    required_permission = "admin.role.update"

    def patch(self, request, role_id):
        from apps.system.services import role_service
        from apps.system.serializers.role_serializer import RoleCreateUpdateSerializer, RoleSerializer
        serializer = RoleCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            role = role_service.update_role(role_id, **serializer.validated_data)
            admin_log_service.log(
                admin=request.user, action_type='ROLE_UPDATE',
                detail=f"{request.user.email} đã cập nhật role {role.code}",
                target_id=str(role.id), target_type='Role',
            )
            return success_response(RoleSerializer(role).data, "Cập nhật role thành công.")
        except Exception as e:
            return error_response(str(e.detail) if hasattr(e, "detail") else str(e), http_status=status.HTTP_400_BAD_REQUEST)


class RoleDeleteAPIView(BasePermissionAPIView):
    """DELETE /api/admin/roles/{id}/ - Xóa role."""
    required_permission = "admin.role.delete"

    def delete(self, request, role_id):
        from apps.system.services import role_service
        try:
            role_service.delete_role(role_id)
            admin_log_service.log(
                admin=request.user, action_type='ROLE_DELETE',
                detail=f"{request.user.email} đã xóa role ID {role_id}",
                target_id=str(role_id), target_type='Role',
            )
            return success_response(None, "Xóa role thành công.")
        except Exception as e:
            return error_response(str(e.detail) if hasattr(e, "detail") else str(e), http_status=status.HTTP_400_BAD_REQUEST)


# ==================== PERMISSION MANAGEMENT ====================


class PermissionListAPIView(BasePermissionAPIView):
    """GET /api/admin/permissions/ - Danh sách tất cả permissions."""
    required_permission = "admin.role.view"

    def get(self, request):
        from apps.system.services import permission_service
        from apps.system.serializers.permission_serializer import PermissionSerializer
        permissions = permission_service.get_all_permissions()
        serializer = PermissionSerializer(permissions, many=True)
        return success_response(serializer.data)


class RolePermissionListAPIView(BasePermissionAPIView):
    """GET /api/admin/roles/{id}/permissions/ - Permissions của 1 role."""
    required_permission = "admin.role.view_permissions"

    def get(self, request, role_id):
        from apps.system.services import permission_service
        from apps.system.serializers.permission_serializer import RolePermissionSerializer
        try:
            permissions = permission_service.get_role_permissions(role_id)
            serializer = RolePermissionSerializer(permissions, many=True)
            return success_response(serializer.data)
        except Exception as e:
            return error_response(str(e.detail) if hasattr(e, "detail") else str(e), http_status=status.HTTP_404_NOT_FOUND)


class RolePermissionUpdateAPIView(BasePermissionAPIView):
    """
    PUT /api/admin/roles/{id}/permissions/ - Cập nhật toàn bộ permissions cho role.
    Body: { "permission_codes": ["course.course.create", "user.user.view", ...] }
    """
    required_permission = "admin.role.assign_permission"

    def put(self, request, role_id):
        from apps.system.services import permission_service
        from apps.system.serializers.permission_serializer import AssignPermissionSerializer
        serializer = AssignPermissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            codes = permission_service.update_role_permissions(role_id, serializer.validated_data["permission_codes"])
            admin_log_service.log(
                admin=request.user, action_type='ROLE_PERMISSION_ASSIGN',
                detail=f"{request.user.email} đã cập nhật permissions cho role ID {role_id}",
                target_id=str(role_id), target_type='Role',
            )
            return success_response({"permission_codes": codes}, "Cập nhật permissions thành công.")
        except Exception as e:
            return error_response(str(e.detail) if hasattr(e, "detail") else str(e), http_status=status.HTTP_400_BAD_REQUEST)