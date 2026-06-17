from rest_framework.response import Response
from rest_framework import status

from apps.common.base_api_view import BasePermissionAPIView

from apps.users.repositories.user_repository import UserRepository
from apps.users.services.user_management_service import UserManagementService
from apps.users.serializers.user_management_serializer import (
    UserManagementListSerializer,
    UserManagementToggleActiveSerializer,
)


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


class UserManageListAPIView(BasePermissionAPIView):
    """
    GET /api/admin/users/ - Lấy danh sách người dùng (Student, Instructor) có phân trang, tìm kiếm, lọc.
    Yêu cầu quyền: SUPERADMIN
    Hỗ trợ: ?page=1&page_size=10&search=&role=&status=
    """
    required_permission = "user.user.view"

    def get(self, request):
        search = request.query_params.get("search", "").strip()
        role_filter = request.query_params.get("role", "all")
        status_filter = request.query_params.get("status", "all")
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 10))

        # Validate role filter
        if role_filter not in ("all", "student", "instructor"):
            role_filter = "all"
        role_param = role_filter if role_filter != "all" else None

        # Validate status filter
        if status_filter not in ("active", "locked", "all"):
            status_filter = "all"
        status_param = status_filter if status_filter != "all" else None

        result = UserManagementService.get_managed_users(
            search=search if search else None,
            role=role_param,
            status=status_param,
            page=page,
            page_size=page_size,
        )

        serializer = UserManagementListSerializer(result["results"], many=True)
        return success_response(
            {
                "results": serializer.data,
                "total": result["total"],
                "page": result["page"],
                "page_size": result["page_size"],
                "total_pages": result["total_pages"],
            },
            "Lấy danh sách người dùng thành công.",
        )


class UserManageToggleActiveAPIView(BasePermissionAPIView):
    """
    PATCH /api/admin/users/<uuid:id>/toggle-active/ - Khóa hoặc mở khóa tài khoản người dùng.
    Yêu cầu quyền: SUPERADMIN
    Chỉ cho phép khóa/mở khóa Student và Instructor.
    Không cho phép khóa/mở khóa tài khoản quản trị (Super Admin, Course Admin, ...).
    Body (khi khóa): { "reason": "Lý do khóa tài khoản" }
    Body (khi mở khóa): {} (không cần lý do)
    """
    required_permission = "user.user.lock"

    def patch(self, request, user_id):
        # Lấy user từ repository
        user = UserRepository.get_user_by_id(user_id)

        # Lấy lý do khóa từ body (nếu có)
        reason = request.data.get("reason", "")

        try:
            user, message = UserManagementService.toggle_user_active(
                user, request.user, reason
            )
            resp_serializer = UserManagementToggleActiveSerializer({
                "id": user.id,
                "is_active": user.is_active,
                "message": message,
            })
            return success_response(resp_serializer.data, message)
        except Exception as e:
            return error_response(
                str(e.detail) if hasattr(e, "detail") else str(e),
                http_status=status.HTTP_400_BAD_REQUEST,
            )
