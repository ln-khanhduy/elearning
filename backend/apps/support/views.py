from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.common.base_api_view import BasePermissionAPIView
from apps.common.response_helpers import success_response
from apps.support import services as support_service
from apps.support.serializers import (
    SupportRequestSerializer, SupportRequestCreateSerializer, SupportRequestProcessSerializer,
)


class MyRequestListAPIView(APIView):
    """
    GET /api/support/my-requests/ - Danh sách yêu cầu của tôi.
    Yêu cầu đăng nhập.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        requests = support_service.get_my_requests(request.user)
        serializer = SupportRequestSerializer(requests, many=True)
        return success_response(serializer.data)


class RequestCreateAPIView(APIView):
    """
    POST /api/support/requests/create/ - Tạo yêu cầu hỗ trợ mới.
    Yêu cầu đăng nhập.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SupportRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request_obj = support_service.create_request(request.user, serializer.validated_data)
        return success_response(
            SupportRequestSerializer(request_obj).data,
            "Yêu cầu đã được gửi thành công.",
            http_status=201,
        )


class RequestProcessAPIView(BasePermissionAPIView):
    """
    PATCH /api/support/requests/{request_id}/process/ - Xử lý yêu cầu.
    """
    def patch(self, request, request_id):
        serializer = SupportRequestProcessSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request_obj = support_service.process_request(request_id, request.user, serializer.validated_data)
        return success_response(
            SupportRequestSerializer(request_obj).data,
            "Đã xử lý yêu cầu.",
        )


class AdminRequestListAPIView(BasePermissionAPIView):
    """
    GET /api/support/admin/requests/ - Danh sách yêu cầu cho admin.
    Lọc theo request_type, status.
    """
    def get(self, request):
        request_type = request.GET.get("request_type")
        if request_type:
            requests = support_service.get_requests_by_type(request_type, request.user)
        else:
            from apps.support import repositories as support_repo
            requests = support_repo.get_all()
        serializer = SupportRequestSerializer(requests, many=True)
        return success_response(serializer.data)