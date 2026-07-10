from rest_framework import serializers
from apps.courses.models import Course
from apps.courses.serializers.category_tag_serializer import CategorySerializer


class CourseListSerializer(serializers.ModelSerializer):
    """Serializer cho danh sách khóa học."""

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
        return obj.created_by.avatar_url if hasattr(obj.created_by, 'avatar_url') else None

    def get_assigned_instructor_name(self, obj):
        if obj.assigned_instructor:
            return obj.assigned_instructor.get_full_name()
        return None

    def get_assigned_instructor_avatar(self, obj):
        if obj.assigned_instructor and hasattr(obj.assigned_instructor, 'avatar_url'):
            return obj.assigned_instructor.avatar_url
        return None

    def get_thumbnail_url(self, obj):
        return obj.thumbnail.url if obj.thumbnail else None

    def get_chapter_count(self, obj):
        """Sử dụng annotation nếu có, nếu không thì query (fallback)."""
        if hasattr(obj, '_chapter_count'):
            return obj._chapter_count
        return obj.chapters.count()

    def get_lesson_count(self, obj):
        if hasattr(obj, '_lesson_count'):
            return obj._lesson_count
        from apps.lessons.models import Lesson
        return Lesson.objects.filter(chapter__course_id=obj.id).count()

    def get_student_count(self, obj):
        if hasattr(obj, '_student_count'):
            return obj._student_count
        from apps.enrollments.models import Enrollment
        return Enrollment.objects.filter(course_id=obj.id, status=Enrollment.Status.ACTIVE).count()


class CourseDetailSerializer(serializers.ModelSerializer):
    """Serializer cho chi tiết khóa học."""

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
        return obj.created_by.avatar_url if hasattr(obj.created_by, 'avatar_url') else None

    def get_assigned_instructor_id(self, obj):
        return obj.assigned_instructor_id

    def get_assigned_instructor_name(self, obj):
        if obj.assigned_instructor:
            return obj.assigned_instructor.get_full_name()
        return None

    def get_assigned_instructor_avatar(self, obj):
        if obj.assigned_instructor and hasattr(obj.assigned_instructor, 'avatar_url'):
            return obj.assigned_instructor.avatar_url
        return None

    def get_assigned_instructor_bio(self, obj):
        if obj.assigned_instructor and hasattr(obj.assigned_instructor, 'instructor_profile'):
            return obj.assigned_instructor.instructor_profile.bio
        return None

    def get_thumbnail_url(self, obj):
        return obj.thumbnail.url if obj.thumbnail else None

    def get_chapter_count(self, obj):
        if hasattr(obj, '_chapter_count'):
            return obj._chapter_count
        return obj.chapters.count()

    def get_lesson_count(self, obj):
        if hasattr(obj, '_lesson_count'):
            return obj._lesson_count
        from apps.lessons.models import Lesson
        return Lesson.objects.filter(chapter__course_id=obj.id).count()


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = [
            "title", "description", "price",
            "category",
            "thumbnail", "preview_video_url",
        ]


class CourseAssignInstructorSerializer(serializers.Serializer):
    instructor_id = serializers.IntegerField(required=False, allow_null=True)