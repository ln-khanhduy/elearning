from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.common.response_helpers import success_response, error_response
from apps.notifications.services import notification_service


# ==================== NOTIFICATION VIEWS ====================
# Dùng APIView + IsAuthenticated thay vì BasePermissionAPIView
# để tránh lỗi 500 khi permission student.learning.view chưa tồn tại


class NotificationListAPIView(APIView):
    """API lấy danh sách thông báo của người dùng."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))
        data = notification_service.get_user_notifications(request.user.id, page, page_size)
        return success_response(data)


class NotificationUnreadCountAPIView(APIView):
    """API đếm số thông báo chưa đọc."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = notification_service.get_unread_count(request.user.id)
        return success_response({"count": count})


class NotificationMarkReadAPIView(APIView):
    """API đánh dấu thông báo đã đọc."""
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        notification_service.mark_as_read(notification_id, request.user.id)
        return success_response(None, "Đã đánh dấu đã đọc.")


class NotificationMarkAllReadAPIView(APIView):
    """API đánh dấu tất cả thông báo đã đọc."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        notification_service.mark_all_as_read(request.user.id)
        return success_response(None, "Đã đánh dấu tất cả đã đọc.")


class NotificationDeleteAllAPIView(APIView):
    """API xóa tất cả thông báo."""
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        notification_service.delete_all(request.user.id)
        return success_response(None, "Đã xóa tất cả thông báo.")
