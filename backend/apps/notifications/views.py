from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.common.response_helpers import success_response, error_response
from apps.notifications.services import notification_service


# ==================== NOTIFICATION VIEWS ====================
# Tất cả chức năng notification đã được chuyển qua WebSocket (/ws/notifications/).
# Các REST API dưới đây được giữ lại cho mục đích tương thích ngược.
# Có thể xóa hoàn toàn sau khi frontend đã chuyển sang WebSocket 100%.