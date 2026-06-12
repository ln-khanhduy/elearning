from rest_framework import serializers
from apps.courses.models import Course


class CourseListSerializer(serializers.ModelSerializer):
    """Serializer cho danh sách khóa học - bao gồm tên instructor, category và URL thumbnail."""

    instructor_name = serializers.CharField(source="instructor.get_full_name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ["id", "title", "slug", "description", "thumbnail_url", "price", "status", "instructor_name", "category_name", "created_at"]

    def get_thumbnail_url(self, obj):
        """Lấy URL đầy đủ của thumbnail khóa học, trả về None nếu không có."""
        return obj.thumbnail.url if obj.thumbnail else None


class CourseDetailSerializer(serializers.ModelSerializer):
    """Serializer cho chi tiết khóa học - bao gồm tên instructor, category, URL thumbnail và thông tin duyệt."""

    instructor_name = serializers.CharField(source="instructor.get_full_name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id", "title", "slug", "description", "thumbnail_url", "preview_video_url",
            "price", "status", "approval_note", "instructor_name", "category_name", "created_at", "updated_at",
        ]

    def get_thumbnail_url(self, obj):
        """Lấy URL đầy đủ của thumbnail khóa học, trả về None nếu không có."""
        return obj.thumbnail.url if obj.thumbnail else None


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer cho tạo/cập nhật khóa học - validate title, thumbnail, price và category."""

    title = serializers.CharField(min_length=5, max_length=50, trim_whitespace=True)

    class Meta:
        model = Course
        fields = ["title", "description", "thumbnail", "preview_video_url", "price", "category"]

    def validate_title(self, value):
        """Kiểm tra tiêu đề khóa học không được để trống hoặc chỉ chứa khoảng trắng."""
        if not value.strip():
            raise serializers.ValidationError("Tiêu đề không được trống")
        return value.strip()


class CourseRejectSerializer(serializers.Serializer):
    """Serializer cho từ chối khóa học - bắt buộc nhập lý do từ chối (tối đa 500 ký tự)."""

    approval_note = serializers.CharField(required=True, allow_blank=False, max_length=500)
