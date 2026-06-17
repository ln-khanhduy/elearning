from rest_framework import serializers
from apps.users.models import User


class UserManagementListSerializer(serializers.ModelSerializer):
    """Serializer cho danh sách người dùng trong User Management (Super Admin)."""

    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "full_name", "email", "phone", "avatar_url",
            "role", "is_active", "date_joined", "last_login",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.first_name or obj.email

    def get_avatar_url(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None

    def get_role(self, obj):
        if obj.role:
            return obj.role.code
        return None


class UserManagementToggleActiveSerializer(serializers.Serializer):
    """Serializer cho response khóa/mở khóa tài khoản trong User Management."""

    id = serializers.UUIDField()
    is_active = serializers.BooleanField()
    message = serializers.CharField()
