from rest_framework import serializers
from apps.courses.models import Course
from apps.courses.serializers.category_tag_serializer import CategorySerializer


class CourseListSerializer(serializers.ModelSerializer):
    """Serializer cho danh sách khóa học - bao gồm tên created_by, assigned_instructor, category và URL thumbnail."""

    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)
    created_by_avatar = serializers.SerializerMethodField()
    assigned_instructor_name = serializers.SerializerMethodField()
    assigned_instructor_avatar = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    thumbnail_url = serializers.SerializerMethodField()
    chapter_count = serializers.SerializerMethodField()
    lesson_count = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id", "title", "slug", "description", "thumbnail_url", "price",
            "status", "created_by_name", "created_by_avatar",
            "assigned_instructor_name", "assigned_instructor_avatar",
            "category", "chapter_count", "lesson_count", "student_count", "created_at",
        ]

    def get_created_by_avatar(self, obj):
        """Lấy URL avatar của người tạo, trả về None nếu không có."""
        return obj.created_by.avatar_url if hasattr(obj.created_by, 'avatar_url') else None

    def get_assigned_instructor_name(self, obj):
        """Lấy tên giảng viên được phân công, trả về None nếu chưa có."""
        if obj.assigned_instructor:
            return obj.assigned_instructor.get_full_name()
        return None

    def get_assigned_instructor_avatar(self, obj):
        """Lấy URL avatar của giảng viên được phân công, trả về None nếu chưa có."""
        if obj.assigned_instructor and hasattr(obj.assigned_instructor, 'avatar_url'):
            return obj.assigned_instructor.avatar_url
        return None

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

    def get_student_count(self, obj):
        """Đếm số học viên đang active của khóa học."""
        from apps.courses.repositories.course_repository import CourseRepository
        return CourseRepository.count_students(obj.id)


class CourseDetailSerializer(serializers.ModelSerializer):
    """Serializer cho chi tiết khóa học - bao gồm tên created_by, assigned_instructor, category và URL thumbnail."""

    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)
    created_by_avatar = serializers.SerializerMethodField()
    assigned_instructor_name = serializers.SerializerMethodField()
    assigned_instructor_avatar = serializers.SerializerMethodField()
    assigned_instructor_bio = serializers.SerializerMethodField()
    assigned_instructor_id = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    thumbnail_url = serializers.SerializerMethodField()
    chapter_count = serializers.SerializerMethodField()
    lesson_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id", "title", "slug", "description", "thumbnail_url", "preview_video_url",
            "price", "status", "created_by_name", "created_by_avatar",
            "assigned_instructor_id", "assigned_instructor_name", "assigned_instructor_avatar", "assigned_instructor_bio",
            "category", "chapter_count", "lesson_count",
            "published_at", "created_at", "updated_at",
        ]

    def get_created_by_avatar(self, obj):
        """Lấy URL avatar của người tạo, trả về None nếu không có."""
        return obj.created_by.avatar_url if hasattr(obj.created_by, 'avatar_url') else None

    def get_assigned_instructor_id(self, obj):
        """Lấy ID giảng viên được phân công, trả về None nếu chưa có."""
        return obj.assigned_instructor_id

    def get_assigned_instructor_name(self, obj):
        """Lấy tên giảng viên được phân công, trả về None nếu chưa có."""
        if obj.assigned_instructor:
            return obj.assigned_instructor.get_full_name()
        return None

    def get_assigned_instructor_avatar(self, obj):
        """Lấy URL avatar của giảng viên được phân công, trả về None nếu chưa có."""
        if obj.assigned_instructor and hasattr(obj.assigned_instructor, 'avatar_url'):
            return obj.assigned_instructor.avatar_url
        return None

    def get_assigned_instructor_bio(self, obj):
        """Lấy mô tả giảng viên từ InstructorProfile, trả về None nếu chưa có."""
        if obj.assigned_instructor and hasattr(obj.assigned_instructor, 'instructor_profile'):
            return obj.assigned_instructor.instructor_profile.bio
        return None

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

    title = serializers.CharField(min_length=5, max_length=100, trim_whitespace=True)
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


class CourseAssignInstructorSerializer(serializers.Serializer):
    """Serializer cho phân công giảng viên.
    - instructor_id: ID (UUID) của giảng viên.
    - Để gỡ giảng viên, gửi instructor_id = null.
    """
    instructor_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
