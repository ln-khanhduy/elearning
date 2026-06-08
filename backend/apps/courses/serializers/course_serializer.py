from rest_framework import serializers
from apps.courses.models import Course


class CourseListSerializer(serializers.ModelSerializer):
    instructor_name = serializers.CharField(source="instructor.get_full_name", read_only=True)
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ["id", "title", "slug", "description", "thumbnail_url", "price", "status", "instructor_name", "created_at"]

    def get_thumbnail_url(self, obj):
        return obj.thumbnail.url if obj.thumbnail else None


class CourseDetailSerializer(serializers.ModelSerializer):
    instructor_name = serializers.CharField(source="instructor.get_full_name", read_only=True)
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ["id", "title", "slug", "description", "thumbnail_url", "preview_video_url", "price", "status", "approval_note", "instructor_name", "created_at", "updated_at"]

    def get_thumbnail_url(self, obj):
        return obj.thumbnail.url if obj.thumbnail else None


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    title = serializers.CharField(min_length=5, max_length=50, trim_whitespace=True)
    class Meta:
        model = Course
        fields = ["title", "description", "thumbnail", "preview_video_url", "price", "category"]
    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Tiêu đề không được trống")
        return value.strip()
    
class CourseRejectSerializer(serializers.Serializer):
    approval_note = serializers.CharField(required=True, allow_blank=False, max_length=500)

