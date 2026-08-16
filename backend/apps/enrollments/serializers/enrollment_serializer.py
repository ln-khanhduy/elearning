from django.utils import timezone
from rest_framework import serializers
from apps.enrollments.models import Enrollment


class EnrollmentSerializer(serializers.ModelSerializer):
    """Serializer cho Enrollment - bao gồm thông tin khóa học, tiến độ và (R2) thời hạn."""
    course_title = serializers.CharField(source="course.title", read_only=True)
    course_thumbnail = serializers.SerializerMethodField()
    instructor_name = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()
    completed_lessons_count = serializers.SerializerMethodField()
    total_lessons_count = serializers.SerializerMethodField()
    last_completed_lesson = serializers.SerializerMethodField()
    # (R2) Thông tin thời hạn truy cập
    expires_at = serializers.DateTimeField(read_only=True)
    is_expired = serializers.SerializerMethodField()
    access_plan = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            "id", "course", "course_title", "course_thumbnail", "instructor_name",
            "status", "progress_percent",
            "completed_lessons_count", "total_lessons_count", "last_completed_lesson",
            "expires_at", "is_expired", "access_plan",
            "enrolled_at", "created_at",
        ]

    def get_instructor_name(self, obj):
        instructor = obj.course.assigned_instructor
        return instructor.get_full_name() if instructor else None

    def get_course_thumbnail(self, obj):
        return obj.course.thumbnail.url if obj.course.thumbnail else None

    def get_progress_percent(self, obj):
        try:
            return float(obj.progress.progress_percent) if hasattr(obj, "progress") and obj.progress else 0
        except Exception:
            return 0

    def get_completed_lessons_count(self, obj):
        try:
            return obj.progress.completed_lessons_count if hasattr(obj, "progress") and obj.progress else 0
        except Exception:
            return 0

    def get_total_lessons_count(self, obj):
        try:
            return obj.progress.total_lessons_count if hasattr(obj, "progress") and obj.progress else 0
        except Exception:
            return 0

    def get_last_completed_lesson(self, obj):
        try:
            if hasattr(obj, "progress") and obj.progress and obj.progress.last_completed_lesson:
                return {
                    "id": obj.progress.last_completed_lesson.id,
                    "title": obj.progress.last_completed_lesson.title,
                }
            return None
        except Exception:
            return None

    def get_is_expired(self, obj):
        """(R2) True khi enrollment đã hết hạn (EXPIRED hoặc expires_at <= now)."""
        if obj.status == Enrollment.Status.EXPIRED:
            return True
        if obj.expires_at is not None:
            return obj.expires_at <= timezone.now()
        return False

    def get_access_plan(self, obj):
        """(R2) Gói truy cập đã mua cho enrollment này."""
        plan = obj.access_plan
        if not plan:
            return None
        return {
            "id": plan.id,
            "name": plan.name,
            "duration_days": plan.duration_days,
            "price": float(plan.price),
        }