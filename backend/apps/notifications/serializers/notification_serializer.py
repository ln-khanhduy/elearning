from rest_framework import serializers
from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    # recipient là UUID ForeignKey, cần explicit field để DRF serialize đúng kiểu
    recipient = serializers.UUIDField(format='hex_verbose', read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id", "recipient", "title", "body", "notification_type",
            "channel", "link", "is_read", "send_status", "created_at",
        ]
        read_only_fields = fields
