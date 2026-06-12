from rest_framework import serializers
from apps.enrollments.models import Enrollment


class EnrollmentSerializer(serializers.ModelSerializer):
    """Serializer cho Enrollment - bao gồm thông tin khóa học."""
    course_title = serializers.CharField(source="course.title", read_only=True)
    course_thumbnail = serializers.SerializerMethodField()
    instructor_name = serializers.CharField(source="course.instructor.get_full_name", read_only=True)
    progress_percent = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            "id", "course", "course_title", "course_thumbnail", "instructor_name",
            "status", "refund_status", "progress_percent",
            "enrolled_at", "completed_at", "created_at",
        ]

    def get_course_thumbnail(self, obj):
        return obj.course.thumbnail.url if obj.course.thumbnail else None

    def get_progress_percent(self, obj):
        try:
            return float(obj.progress.progress_percent) if hasattr(obj, "progress") and obj.progress else 0
        except Exception:
            return 0
