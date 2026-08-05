from rest_framework import serializers
from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer cho mô hình Notification.

    - recipient là UUID ForeignKey, cần khai báo explicit field để DRF serialize đúng kiểu.
    - Toàn bộ trường được đánh dấu read_only (thông báo chỉ được tạo từ phía hệ thống).
    """
    # recipient là UUID ForeignKey, cần explicit field để DRF serialize đúng kiểu
    recipient = serializers.UUIDField(format='hex_verbose', read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id", "recipient", "title", "body", "notification_type",
            "channel", "link", "is_read", "send_status", "created_at",
        ]
        read_only_fields = fields
