from rest_framework import serializers
from apps.users.models import User


class InstructorListSerializer(serializers.ModelSerializer):
    """Serializer cho danh sách giảng viên trong Instructor Manager."""

    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "full_name", "email", "phone", "avatar_url",
            "is_active", "date_joined", "last_login",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.first_name or obj.email

    def get_avatar_url(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None


class LockInstructorSerializer(serializers.Serializer):
    """Serializer cho request khóa tài khoản giảng viên - yêu cầu lý do khóa."""

    reason = serializers.CharField(required=True, allow_blank=False, trim_whitespace=True)

    def validate_reason(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Vui lòng nhập lý do khóa tài khoản.")
        return value.strip()


class ToggleActiveSerializer(serializers.Serializer):
    """Serializer cho response khóa/mở khóa tài khoản."""

    id = serializers.UUIDField()
    is_active = serializers.BooleanField()
    message = serializers.CharField()
