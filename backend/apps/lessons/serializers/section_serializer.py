from rest_framework import serializers
from apps.lessons.models import Section


class SectionSerializer(serializers.ModelSerializer):
    """Serializer cho chương học - bao gồm thông tin course, thứ tự và thời gian."""

    class Meta:
        model = Section
        fields = ["id", "title", "description", "order", "course", "created_at", "updated_at"]
        read_only_fields = ["id", "course", "created_at", "updated_at"]


class SectionCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer cho tạo/cập nhật chương học - validate title và order."""

    title = serializers.CharField(min_length=3, max_length=50, trim_whitespace=True)

    class Meta:
        model = Section
        fields = ["title", "description", "order"]

    def validate_title(self, value):
        """Kiểm tra tên chương không được để trống hoặc chỉ chứa khoảng trắng."""
        if not value.strip():
            raise serializers.ValidationError("Tên chương không được để trống.")
        return value.strip()

    def validate_order(self, value):
        """Kiểm tra thứ tự chương phải là số không âm."""
        if value < 0:
            raise serializers.ValidationError("Thứ tự chương không hợp lệ.")
        return value


class SectionReorderSerializer(serializers.Serializer):
    """Serializer cho sắp xếp lại thứ tự chương học - nhận danh sách chương kèm id và order mới."""

    sections = serializers.ListField(child=serializers.DictField(), allow_empty=False)
