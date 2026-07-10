from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework import status

from apps.common.response_helpers import success_response
from apps.notifications import services as notif_service
from apps.notifications.serializers import NotificationSerializer


class NotificationListAPIView(APIView):
    """
    GET /api/notifications/ - Danh sách thông báo (phân trang).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 20))
        result = notif_service.get_user_notifications(request.user.id, page, page_size)
        result["items"] = NotificationSerializer(result["items"], many=True).data
        return success_response(result)


class NotificationUnreadCountAPIView(APIView):
    """
    GET /api/notifications/unread-count/ - Số thông báo chưa đọc.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = notif_service.get_unread_count(request.user.id)
        return success_response({"count": count})


class NotificationMarkReadAPIView(APIView):
    """
    PATCH /api/notifications/{id}/read/ - Đánh dấu đã đọc.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, notification_id):
        notif_service.mark_as_read(notification_id, request.user.id)
        return success_response(None, "Đã đánh dấu đã đọc.")


class NotificationMarkAllReadAPIView(APIView):
    """
    PATCH /api/notifications/read-all/ - Đánh dấu tất cả đã đọc.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        notif_service.mark_all_as_read(request.user.id)
        return success_response(None, "Đã đánh dấu tất cả đã đọc.")


class NotificationDeleteAllAPIView(APIView):
    """
    DELETE /api/notifications/delete-all/ - Xóa tất cả thông báo của user hiện tại.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        notif_service.delete_all(request.user.id)
        return success_response(None, "Đã xóa tất cả thông báo.")
