from rest_framework import status
from rest_framework.response import Response

from apps.common.base_api_view import BasePermissionAPIView
from apps.users.services import instructor_manager_service
from apps.users.serializers.instructor_manager_serializer import (
    InstructorListSerializer,
    LockInstructorSerializer,
    ToggleActiveSerializer,
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


class InstructorManageListAPIView(BasePermissionAPIView):
    """
    GET /api/instructors/manage/
    Danh sách giảng viên dành cho admin quản lý.
    Filter: search, status, page, page_size
    """
    required_permission = "user.instructor.manage"

    def get(self, request):
        search = request.query_params.get("search", "").strip()
        status_filter = request.query_params.get("status", "all")
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 10))

        if status_filter not in ("active", "locked", "all"):
            status_filter = "all"

        result = instructor_manager_service.get_instructors(
            search=search if search else None,
            status=status_filter if status_filter != "all" else None,
            page=page,
            page_size=page_size,
        )
        serializer = InstructorListSerializer(result["results"], many=True)
        return success_response({
            "results": serializer.data,
            "total": result["total"],
            "page": result["page"],
            "page_size": result["page_size"],
            "total_pages": result["total_pages"],
        })


class InstructorLockAPIView(BasePermissionAPIView):
    """
    PATCH /api/instructors/manage/<uuid:user_id>/lock/
    Khóa tài khoản giảng viên.
    """
    required_permission = "user.instructor.lock"

    def patch(self, request, user_id):
        serializer = LockInstructorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user, message = instructor_manager_service.lock_instructor(
                user_id=user_id,
                admin_user=request.user,
                reason=serializer.validated_data["reason"],
            )
            resp_serializer = ToggleActiveSerializer({
                "id": user.id, "is_active": user.is_active, "message": message,
            })
            return success_response(resp_serializer.data, message)
        except Exception as e:
            detail = e.detail if hasattr(e, "detail") else str(e)
            return error_response(detail, http_status=status.HTTP_400_BAD_REQUEST)


class InstructorUnlockAPIView(BasePermissionAPIView):
    """
    PATCH /api/instructors/manage/<uuid:user_id>/unlock/
    Mở khóa tài khoản giảng viên.
    """
    required_permission = "user.instructor.lock"

    def patch(self, request, user_id):
        try:
            user, message = instructor_manager_service.unlock_instructor(
                user_id=user_id,
                admin_user=request.user,
            )
            resp_serializer = ToggleActiveSerializer({
                "id": user.id, "is_active": user.is_active, "message": message,
            })
            return success_response(resp_serializer.data, message)
        except Exception as e:
            detail = e.detail if hasattr(e, "detail") else str(e)
            return error_response(detail, http_status=status.HTTP_400_BAD_REQUEST)