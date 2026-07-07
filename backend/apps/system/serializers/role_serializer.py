from rest_framework import serializers
from apps.users.models import Role


class RoleSerializer(serializers.ModelSerializer):
    """Serializer cho Role."""
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ["id", "code", "name", "user_count"]

    def get_user_count(self, obj):
        from apps.users.models import User
        return User.objects.filter(role=obj).count()


class RoleCreateUpdateSerializer(serializers.Serializer):
    """Serializer cho tạo/cập nhật Role."""
    code = serializers.CharField(max_length=50, required=True)
    name = serializers.CharField(max_length=100, required=True)