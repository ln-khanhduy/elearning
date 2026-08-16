from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from apps.users.models import User, Role
from apps.users.repositories import user_repository


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


class AdminUserResetPasswordSerializer(serializers.Serializer):
    """Serializer cho đặt lại mật khẩu người dùng (chỉ SUPERADMIN)."""

    new_password = serializers.CharField(required=True, write_only=True)

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value


class AdminUserCreateSerializer(serializers.Serializer):
    """Serializer cho tạo tài khoản mới (chỉ SUPERADMIN)."""

    full_name = serializers.CharField(required=True, max_length=200)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    password = serializers.CharField(required=True, write_only=True)
    role_code = serializers.ChoiceField(
        required=True,
        choices=["STUDENT", "INSTRUCTOR", "COURSE_ADMIN", "USER_MANAGER"],
        error_messages={"invalid_choice": "Vai trò không hợp lệ."},
    )

    def validate_email(self, value):
        email = (value or "").lower().strip()
        if not email:
            raise serializers.ValidationError("Email không được để trống.")
        if user_repository.get_user_by_email(email):
            raise serializers.ValidationError("Email này đã được sử dụng.")
        return email

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate_role_code(self, value):
        if value == "SUPERADMIN":
            raise serializers.ValidationError("Không thể tạo tài khoản Super Admin qua API.")
        if not Role.objects.filter(code=value).exists():
            raise serializers.ValidationError("Vai trò không tồn tại trong hệ thống.")
        return value