import re
from rest_framework import serializers
from apps.lessons.models import Lesson


def validate_youtube_url(value):
    """Kiểm tra URL YouTube hợp lệ và trích xuất Video ID."""
    if not value:
        return value
    youtube_regex = (
        r'(https?://)?(www\.)?'
        r'(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)'
        r'([a-zA-Z0-9_-]{11})'
    )
    match = re.match(youtube_regex, value)
    if not match:
        raise serializers.ValidationError("URL YouTube không hợp lệ.")
    return value


class LessonSerializer(serializers.ModelSerializer):
    """Serializer cho bài học - bao gồm URL video và tài liệu từ file upload."""

    chapter = serializers.IntegerField(source="chapter_id", read_only=True)
    video_url = serializers.SerializerMethodField()
    material_url = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            "id", "chapter", "slug", "title", "description", "content_type",
            "video_url", "material_url", "order",
            "status", "created_at", "updated_at",
        ]

    def get_video_url(self, obj):
        """Lấy URL video của bài học."""
        return obj.video_url

    def get_material_url(self, obj):
        """Lấy URL đầy đủ của tài liệu bài học, trả về None nếu không có."""
        return obj.material_file.url if obj.material_file else None


class LessonPreviewSerializer(serializers.ModelSerializer):
    """
    Serializer cho preview bài học - CHỈ trả về thông tin cơ bản.
    KHÔNG expose video_url, material_url.
    Dùng cho public API (CourseCurriculumAPIView).
    """
    class Meta:
        model = Lesson
        fields = [
            "id", "slug", "title", "description", "content_type",
            "order", "status",
        ]


class LessonCreateUpdateSerializer(serializers.ModelSerializer):

    """Serializer cho tạo/cập nhật bài học - validate title, order, content_type, video_url, material_file."""

    title = serializers.CharField(min_length=3, max_length=50, trim_whitespace=True)

    class Meta:
        model = Lesson
        fields = [
            "title", "description", "content_type", "video_url",
            "material_file", "order", "status",
        ]

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

    def validate_video_url(self, value):
        """Kiểm tra URL YouTube hợp lệ nếu content_type là VIDEO."""
        return validate_youtube_url(value)

    def validate(self, attrs):
        """Validate phụ thuộc content_type."""
        content_type = attrs.get("content_type")
        video_url = attrs.get("video_url")
        material_file = attrs.get("material_file")
        is_partial = self.partial

        if content_type == "VIDEO" and not video_url:
            raise serializers.ValidationError({"video_url": "Bài học VIDEO phải có URL video."})

        if content_type == "DOCUMENT" and not material_file and not is_partial:
            raise serializers.ValidationError({"material_file": "Bài học DOCUMENT phải có tài liệu đính kèm."})

        return attrs


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
