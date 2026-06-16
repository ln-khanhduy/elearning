from rest_framework import serializers
from apps.courses.models import Course
from apps.courses.serializers.category_tag_serializer import CategorySerializer


class CourseListSerializer(serializers.ModelSerializer):
    """Serializer cho danh sách khóa học - bao gồm tên instructor, category và URL thumbnail."""

    instructor_name = serializers.CharField(source="instructor.get_full_name", read_only=True)
    instructor_avatar = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    thumbnail_url = serializers.SerializerMethodField()
    chapter_count = serializers.SerializerMethodField()
    lesson_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id", "title", "slug", "description", "thumbnail_url", "price",
            "status", "instructor_name", "instructor_avatar", "category",
            "chapter_count", "lesson_count", "created_at",
        ]

    def get_instructor_avatar(self, obj):
        """Lấy URL avatar của instructor, trả về None nếu không có."""
        return obj.instructor.avatar_url if hasattr(obj.instructor, 'avatar_url') else None

    def get_thumbnail_url(self, obj):
        """Lấy URL đầy đủ của thumbnail khóa học, trả về None nếu không có."""
        return obj.thumbnail.url if obj.thumbnail else None

    def get_chapter_count(self, obj):
        """Đếm số chương (section) của khóa học."""
        from apps.courses.repositories.course_repository import CourseRepository
        return CourseRepository.count_chapters(obj.id)

    def get_lesson_count(self, obj):
        """Đếm số bài học của khóa học."""
        from apps.courses.repositories.course_repository import CourseRepository
        return CourseRepository.count_lessons(obj.id)


class CourseDetailSerializer(serializers.ModelSerializer):
    """Serializer cho chi tiết khóa học - bao gồm tên instructor, category, URL thumbnail và thông tin duyệt."""

    instructor_name = serializers.CharField(source="instructor.get_full_name", read_only=True)
    instructor_avatar = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    thumbnail_url = serializers.SerializerMethodField()
    chapter_count = serializers.SerializerMethodField()
    lesson_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id", "title", "slug", "description", "thumbnail_url", "preview_video_url",
            "price", "status", "approval_note", "instructor_name", "instructor_avatar", "category",
            "chapter_count", "lesson_count", "created_at", "updated_at",
        ]

    def get_instructor_avatar(self, obj):
        """Lấy URL avatar của instructor, trả về None nếu không có."""
        return obj.instructor.avatar_url if hasattr(obj.instructor, 'avatar_url') else None

    def get_thumbnail_url(self, obj):
        """Lấy URL đầy đủ của thumbnail khóa học, trả về None nếu không có."""
        return obj.thumbnail.url if obj.thumbnail else None

    def get_chapter_count(self, obj):
        """Đếm số chương (section) của khóa học."""
        from apps.courses.repositories.course_repository import CourseRepository
        return CourseRepository.count_chapters(obj.id)

    def get_lesson_count(self, obj):
        """Đếm số bài học của khóa học."""
        from apps.courses.repositories.course_repository import CourseRepository
        return CourseRepository.count_lessons(obj.id)


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer cho tạo/cập nhật khóa học - validate title, thumbnail, price, category."""

    title = serializers.CharField(min_length=5, max_length=50, trim_whitespace=True)
    thumbnail = serializers.FileField(allow_null=True, required=False)

    class Meta:
        model = Course
        fields = ["title", "description", "thumbnail", "preview_video_url", "price", "category"]

    def validate_title(self, value):
        """Kiểm tra tiêu đề khóa học không được để trống hoặc chỉ chứa khoảng trắng."""
        if not value.strip():
            raise serializers.ValidationError("Tiêu đề không được trống")
        return value.strip()

    def validate_price(self, value):
        """Kiểm tra price >= 0."""
        if value < 0:
            raise serializers.ValidationError("Giá không được âm.")
        return value


class CourseRejectSerializer(serializers.Serializer):
    """Serializer cho từ chối khóa học - bắt buộc nhập lý do từ chối (tối đa 500 ký tự)."""

    approval_note = serializers.CharField(required=True, allow_blank=False, max_length=500)
