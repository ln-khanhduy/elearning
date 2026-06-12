from rest_framework import serializers
from apps.courses.models import Category, Tag


class CategorySerializer(serializers.ModelSerializer):
    """Serializer cho danh mục khóa học."""

    class Meta:
        model = Category
        fields = ["id", "name", "slug"]
        read_only_fields = ["id", "slug"]

    def validate_name(self, value):
        """Kiểm tra tên danh mục không được để trống."""
        if not value.strip():
            raise serializers.ValidationError("Tên danh mục không được để trống.")
        return value.strip()


class TagSerializer(serializers.ModelSerializer):
    """Serializer cho tag khóa học."""

    class Meta:
        model = Tag
        fields = ["id", "name", "slug"]
        read_only_fields = ["id", "slug"]

    def validate_name(self, value):
        """Kiểm tra tên tag không được để trống."""
        if not value.strip():
            raise serializers.ValidationError("Tên tag không được để trống.")
        return value.strip()
