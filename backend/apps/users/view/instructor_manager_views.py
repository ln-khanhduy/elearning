from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from apps.common.permissions import HasRequiredPermission

from apps.users.services.instructor_manager_service import InstructorManagerService
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


class InstructorManageListAPIView(APIView):
    """
    GET /api/instructors/manage/ - Lấy danh sách giảng viên (có phân trang, tìm kiếm, lọc).
    Yêu cầu quyền: user.instructor.view
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "user.instructor.view"

    def get(self, request):
        search = request.query_params.get("search", "").strip()
        status_filter = request.query_params.get("status", "all")
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 10))

        # Chỉ nhận status: active, locked, all
        if status_filter not in ("active", "locked", "all"):
            status_filter = "all"
        status_param = status_filter if status_filter != "all" else None

        result = InstructorManagerService.get_instructors(
            search=search if search else None,
            status=status_param,
            page=page,
            page_size=page_size,
        )

        serializer = InstructorListSerializer(result["results"], many=True)
        return success_response(
            {
                "results": serializer.data,
                "total": result["total"],
                "page": result["page"],
                "page_size": result["page_size"],
                "total_pages": result["total_pages"],
            },
            "Lấy danh sách giảng viên thành công.",
        )


class InstructorLockAPIView(APIView):
    """
    PATCH /api/instructors/manage/<id>/lock/ - Khóa tài khoản giảng viên.
    Yêu cầu quyền: user.instructor.lock
    Body: { "reason": "Lý do khóa tài khoản" }
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "user.instructor.lock"

    def patch(self, request, user_id):
        serializer = LockInstructorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user, message = InstructorManagerService.lock_instructor(
                user_id, request.user, serializer.validated_data["reason"]
            )
            resp_serializer = ToggleActiveSerializer({
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


class InstructorUnlockAPIView(APIView):
    """
    PATCH /api/instructors/manage/<id>/unlock/ - Mở khóa tài khoản giảng viên.
    Yêu cầu quyền: user.instructor.lock
    Không cần body.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "user.instructor.lock"

    def patch(self, request, user_id):
        try:
            user, message = InstructorManagerService.unlock_instructor(user_id, request.user)
            resp_serializer = ToggleActiveSerializer({
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
