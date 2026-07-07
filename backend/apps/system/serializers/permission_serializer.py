from rest_framework import serializers
from apps.users.models import RolePermission


class PermissionSerializer(serializers.Serializer):
    """Serializer cho Permission từ registry."""
    code = serializers.CharField()
    name = serializers.CharField()
    group = serializers.CharField()


class RolePermissionSerializer(serializers.ModelSerializer):
    """Serializer cho RolePermission model."""
    class Meta:
        model = RolePermission
        fields = ["id", "code", "name"]


class AssignPermissionSerializer(serializers.Serializer):
    """Serializer cho gán permissions."""
    permission_codes = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=False,
    )