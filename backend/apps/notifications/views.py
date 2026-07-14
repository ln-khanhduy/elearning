from rest_framework import status

from apps.common.base_api_view import BasePermissionAPIView
from apps.common.response_helpers import success_response, error_response
from apps.notifications.services import notification_service


# ==================== NOTIFICATION VIEWS ====================


class NotificationListAPIView(BasePermissionAPIView):
    """API lấy danh sách thông báo của người dùng."""
    required_permission = "student.learning.view"

    def get(self, request):
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))
        data = notification_service.get_user_notifications(request.user.id, page, page_size)
        return success_response(data)


class NotificationUnreadCountAPIView(BasePermissionAPIView):
    """API đếm số thông báo chưa đọc."""
    required_permission = "student.learning.view"

    def get(self, request):
        count = notification_service.get_unread_count(request.user.id)
        return success_response({"count": count})


class NotificationMarkReadAPIView(BasePermissionAPIView):
    """API đánh dấu thông báo đã đọc."""
    required_permission = "student.learning.view"

    def post(self, request, notification_id):
        notification_service.mark_as_read(notification_id, request.user.id)
        return success_response(None, "Đã đánh dấu đã đọc.")


class NotificationMarkAllReadAPIView(BasePermissionAPIView):
    """API đánh dấu tất cả thông báo đã đọc."""
    required_permission = "student.learning.view"

    def post(self, request):
        notification_service.mark_all_as_read(request.user.id)
        return success_response(None, "Đã đánh dấu tất cả đã đọc.")


class NotificationDeleteAllAPIView(BasePermissionAPIView):
    """API xóa tất cả thông báo."""
    required_permission = "student.learning.view"

    def delete(self, request):
        notification_service.delete_all(request.user.id)
        return success_response(None, "Đã xóa tất cả thông báo.")
