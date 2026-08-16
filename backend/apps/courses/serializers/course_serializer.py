from decimal import Decimal
from rest_framework import serializers
from apps.courses.models import Course, CourseAccessPlan
from apps.courses.serializers.category_tag_serializer import CategorySerializer
from apps.common.bunny_service import generate_bunny_embed_url, normalize_bunny_video_url


class CourseAccessPlanSerializer(serializers.ModelSerializer):
    """Serializer cho GÓI truy cập của khóa học (tên + thời gian + giá)."""

    class Meta:
        model = CourseAccessPlan
        fields = ["id", "name", "duration_days", "price"]


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
    #Dữ liệu gói truy cập — hiển thị gói kích hoạt + giá từ (min price)
    access_plans = serializers.SerializerMethodField()
    min_price = serializers.SerializerMethodField()
    # Dữ liệu được truyền qua serializer.context để tránh N+1.
    is_enrolled = serializers.SerializerMethodField()
    is_owned = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id", "title", "slug", "description", "thumbnail_url",
            "status", "created_by_name", "created_by_avatar",
            "assigned_instructor_name", "assigned_instructor_avatar",
            "category", "chapter_count", "lesson_count", "student_count",
            "access_plans", "min_price",
            "is_enrolled", "is_owned", "created_at",
        ]

    def get_created_by_avatar(self, obj):
        """Lấy URL avatar của người tạo khóa học, trả về None nếu không có."""
        return obj.created_by.avatar_url if hasattr(obj.created_by, 'avatar_url') else None

    def get_assigned_instructor_name(self, obj):
        """ Lấy tên đầy đủ của giảng viên được phân công, trả về None nếu không có. """
        if obj.assigned_instructor:
            return obj.assigned_instructor.get_full_name()
        return None

    def get_assigned_instructor_avatar(self, obj):
        """ Lấy URL avatar của giảng viên được phân công, trả về None nếu không có. """
        if obj.assigned_instructor and hasattr(obj.assigned_instructor, 'avatar_url'):
            return obj.assigned_instructor.avatar_url
        return None

    def get_thumbnail_url(self, obj):
        """Lấy URL thumbnail của khóa học, trả về None nếu không có."""
        return obj.thumbnail.url if obj.thumbnail else None

    def get_chapter_count(self, obj):
        """Sử dụng annotation nếu có, nếu không thì query (fallback)."""
        if hasattr(obj, '_chapter_count'):
            return obj._chapter_count
        return obj.chapters.count()

    def get_lesson_count(self, obj):
        """Sử dụng annotation nếu có, nếu không thì query (fallback)."""
        if hasattr(obj, '_lesson_count'):
            return obj._lesson_count
        from apps.lessons.models import Lesson
        return Lesson.objects.filter(chapter__course_id=obj.id).count()

    def get_student_count(self, obj):
        """Sử dụng annotation nếu có, nếu không thì query (fallback)."""
        if hasattr(obj, '_student_count'):
            return obj._student_count
        from apps.enrollments.models import Enrollment
        return Enrollment.objects.filter(
            course_id=obj.id,
            status__in=[Enrollment.Status.ACTIVE, Enrollment.Status.COMPLETED],
        ).count()

    def get_access_plans(self, obj):
        """Danh sách gói kích hoạt (tên + số ngày + giá)."""
        if hasattr(obj, '_active_access_plans'):
            plans = obj._active_access_plans
        else:
            plans = obj.access_plans.all()
        return CourseAccessPlanSerializer(plans, many=True).data

    def get_min_price(self, obj):
        """Giá thấp nhất trong các gói kích hoạt — dùng hiển thị 'từ X₫'."""
        plans = []
        if hasattr(obj, '_active_access_plans'):
            plans = obj._active_access_plans
        else:
            plans = obj.access_plans.all()
        prices = [Decimal(p.price) for p in plans if p.price is not None]
        if not prices:
            return None
        return float(min(prices))

    def get_is_enrolled(self, obj):
        """Kiểm tra xem người dùng hiện tại có đang theo dõi khóa học này không."""
        enrolled_ids = (self.context or {}).get("enrolled_ids")
        if enrolled_ids is not None:
            return obj.id in enrolled_ids
        return False

    def get_is_owned(self, obj):
        """Kiểm tra xem người dùng hiện tại có đang sở hữu khóa học này không."""
        owned_ids = (self.context or {}).get("owned_ids")
        if owned_ids is not None:
            return obj.id in owned_ids
        return False


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
    preview_video_url = serializers.SerializerMethodField()
    chapter_count = serializers.SerializerMethodField()
    lesson_count = serializers.SerializerMethodField()
    #Danh sách gói kích hoạt đầy đủ (id, tên, số ngày, giá)
    access_plans = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id", "title", "slug", "description", "thumbnail_url", "preview_video_url",
            "status", "created_by_name", "created_by_avatar",
            "assigned_instructor_id", "assigned_instructor_name", "assigned_instructor_avatar", "assigned_instructor_bio",
            "category", "chapter_count", "lesson_count",
            "access_plans",
            "published_at", "created_at", "updated_at",
        ]

    def get_created_by_avatar(self, obj):
        """Lấy URL avatar của người tạo khóa học, trả về None nếu không có."""
        return obj.created_by.avatar_url if hasattr(obj.created_by, 'avatar_url') else None

    def get_assigned_instructor_id(self, obj):
        """Lấy ID của giảng viên được phân công, trả về None nếu không có."""
        return obj.assigned_instructor_id

    def get_assigned_instructor_name(self, obj):
        """Lấy tên đầy đủ của giảng viên được phân công, trả về None nếu không có."""
        if obj.assigned_instructor:
            return obj.assigned_instructor.get_full_name()
        return None

    def get_assigned_instructor_avatar(self, obj):
        """Lấy URL avatar của giảng viên được phân công, trả về None nếu không có."""
        if obj.assigned_instructor and hasattr(obj.assigned_instructor, 'avatar_url'):
            return obj.assigned_instructor.avatar_url
        return None

    def get_assigned_instructor_bio(self, obj):
        """Lấy tiểu sử (bio) của giảng viên được phân công, trả về None nếu không có."""
        if obj.assigned_instructor and hasattr(obj.assigned_instructor, 'instructor_profile'):
            return obj.assigned_instructor.instructor_profile.bio
        return None

    def get_thumbnail_url(self, obj):
        """Lấy URL thumbnail của khóa học, trả về None nếu không có."""
        return obj.thumbnail.url if obj.thumbnail else None

    def get_preview_video_url(self, obj):
        """
        Lấy URL video giới thiệu (trailer).

        - Chuẩn hóa về URL KHÔNG token nếu DB đang lưu URL cũ kèm token/expires.
        - Trả SIGNED URL runtime để Bunny embed token authentication hoạt động
          (trailer là nội dung công khai nhưng vẫn cần token runtime nếu Bunny bật bảo mật).
        """
        if not obj.preview_video_url:
            return None
        if "mediadelivery.net" not in (obj.preview_video_url or ""):
            return obj.preview_video_url  # YouTube — không cần sign
        return generate_bunny_embed_url(obj.preview_video_url)

    def get_chapter_count(self, obj):
        """Sử dụng annotation nếu có, nếu không thì query (fallback)."""
        if hasattr(obj, '_chapter_count'):
            return obj._chapter_count
        return obj.chapters.count()

    def get_lesson_count(self, obj):
        """Sử dụng annotation nếu có, nếu không thì query (fallback)."""
        if hasattr(obj, '_lesson_count'):
            return obj._lesson_count
        from apps.lessons.models import Lesson
        return Lesson.objects.filter(chapter__course_id=obj.id).count()

    def get_access_plans(self, obj):
        """Danh sách gói kích hoạt đầy đủ."""
        plans = obj.access_plans.all().order_by("duration_days")
        return CourseAccessPlanSerializer(plans, many=True).data


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    """Bỏ trường `price` — giá chỉ nằm trong CourseAccessPlan."""

    class Meta:
        model = Course
        fields = [
            "title", "description",
            "category",
            "thumbnail", "preview_video_url",
        ]

    def validate_preview_video_url(self, value):
        """Luôn chuẩn hóa URL Bunny về dạng KHÔNG token trước khi lưu database."""
        if not value:
            return value
        return normalize_bunny_video_url(value)


class CourseAssignInstructorSerializer(serializers.Serializer):
    instructor_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)