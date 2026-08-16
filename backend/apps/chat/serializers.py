from rest_framework import serializers
from apps.chat.models import ChatRoom, ChatMessage


class ChatRoomSerializer(serializers.ModelSerializer):
    """Serializer phòng chat - kèm thông tin khóa."""
    course_id = serializers.UUIDField(source="course.id", read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)
    course_slug = serializers.CharField(source="course.slug", read_only=True)

    class Meta:
        model = ChatRoom
        fields = ["id", "course_id", "course_title", "course_slug", "created_at"]


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer tin nhắn - kèm thông tin người gửi."""
    sender_id = serializers.UUIDField(source="sender.id", read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = [
            "id", "room", "sender_id", "sender_name", "sender_avatar",
            "message_type", "content", "audio_url", "audio_duration",
            "audio_format", "replied_to", "sent_at",
        ]
        read_only_fields = ["id", "sent_at"]

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.email

    def get_sender_avatar(self, obj):
        return obj.sender.avatar_url if hasattr(obj.sender, "avatar_url") else None


class CreateTextMessageSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=1000, required=True)


class ReportMessageSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=2000, required=True)