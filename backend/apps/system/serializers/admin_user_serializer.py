from rest_framework import serializers
from apps.users.models import User


class AdminUserListSerializer(serializers.ModelSerializer):
    """Serializer cho danh sách người dùng trong Admin User Management."""

    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    role_code = serializers.SerializerMethodField()
    role_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "full_name", "email", "phone", "avatar_url",
            "role_code", "role_name", "is_active", "date_joined", "last_login",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.first_name or obj.email

    def get_avatar_url(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None

    def get_role_code(self, obj):
        if obj.role:
            return obj.role.code
        return None

    def get_role_name(self, obj):
        if obj.role:
            return obj.role.name
        return None


class AdminUserToggleActiveSerializer(serializers.Serializer):
    """Serializer cho response khóa/mở khóa tài khoản."""

    id = serializers.UUIDField()
    is_active = serializers.BooleanField()
    message = serializers.CharField()


class AdminUserChangeRoleSerializer(serializers.Serializer):
    """Serializer cho thay đổi role người dùng."""

    role_id = serializers.IntegerField(required=True)