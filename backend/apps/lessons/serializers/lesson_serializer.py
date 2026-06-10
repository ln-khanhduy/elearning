from rest_framework import serializers
from apps.lessons.models import Lesson


class LessonSerializer(serializers.ModelSerializer):
    """Serializer cho bài học - bao gồm URL video và tài liệu từ file upload."""

    video_url = serializers.SerializerMethodField()
    material_url = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            "id", "section", "slug", "title", "description", "content_type",
            "video_url", "material_url", "order", "duration_seconds",
            "is_free", "status", "created_at", "updated_at",
        ]

    def get_video_url(self, obj):
        """Lấy URL đầy đủ của video bài học, trả về None nếu không có."""
        return obj.video_file.url if obj.video_file else None

    def get_material_url(self, obj):
        """Lấy URL đầy đủ của tài liệu bài học, trả về None nếu không có."""
        return obj.material_file.url if obj.material_file else None


class LessonCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer cho tạo/cập nhật bài học - validate title, order, duration và content_type."""

    title = serializers.CharField(min_length=3, max_length=50, trim_whitespace=True)

    class Meta:
        model = Lesson
        fields = ["title", "description", "content_type", "video_file", "material_file", "order", "duration_seconds", "is_free", "status"]

    def validate_title(self, value):
        """Kiểm tra tên bài học không được để trống hoặc chỉ chứa khoảng trắng."""
        if not value.strip():
            raise serializers.ValidationError("Tên bài học không được để trống.")
        return value.strip()

    def validate_order(self, value):
        """Kiểm tra thứ tự bài học phải là số không âm."""
        if value < 0:
            raise serializers.ValidationError("Thứ tự bài học không hợp lệ.")
        return value

    def validate_duration_seconds(self, value):
        """Kiểm tra thời lượng bài học phải là số không âm."""
        if value < 0:
            raise serializers.ValidationError("Thời lượng bài học không hợp lệ.")
        return value


class LessonReorderSerializer(serializers.Serializer):
    """Serializer cho sắp xếp lại thứ tự bài học - nhận danh sách bài học kèm id và order mới."""

    lessons = serializers.ListField(child=serializers.DictField(), allow_empty=False)

    def validate_lessons(self, value):
        """Kiểm tra mỗi bài học trong danh sách phải có id và order, và order phải không âm."""
        for item in value:
            if "id" not in item or "order" not in item:
                raise serializers.ValidationError("Mỗi bài học cần có id và order.")
            if item["order"] < 0:
                raise serializers.ValidationError("Thứ tự bài học không hợp lệ.")
        return value
