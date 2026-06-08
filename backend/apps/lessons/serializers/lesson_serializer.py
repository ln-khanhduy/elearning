from rest_framework import serializers
from apps.lessons.models import Lesson


class LessonSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()
    material_url = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ["id", "section", "slug", "title", "description", "content_type", "video_url", "material_url", "order", "duration_seconds", "is_free", "status", "created_at", "updated_at"]

    def get_video_url(self, obj):
        return obj.video_file.url if obj.video_file else None

    def get_material_url(self, obj):
        return obj.material_file.url if obj.material_file else None


class LessonCreateUpdateSerializer(serializers.ModelSerializer):
    title = serializers.CharField(min_length=3, max_length=50, trim_whitespace=True)

    class Meta:
        model = Lesson
        fields = ["title", "description", "content_type", "video_file", "material_file", "order", "duration_seconds", "is_free", "status"]

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Tên bài học không được để trống.")
        return value.strip()

    def validate_order(self, value):
        if value < 0:
            raise serializers.ValidationError("Thứ tự bài học không hợp lệ.")
        return value

    def validate_duration_seconds(self, value):
        if value < 0:
            raise serializers.ValidationError("Thời lượng bài học không hợp lệ.")
        return value


class LessonReorderSerializer(serializers.Serializer):
    lessons = serializers.ListField(child=serializers.DictField(), allow_empty=False)

    def validate_lessons(self, value):
        for item in value:
            if "id" not in item or "order" not in item:
                raise serializers.ValidationError("Mỗi bài học cần có id và order.")
            if item["order"] < 0:
                raise serializers.ValidationError("Thứ tự bài học không hợp lệ.")
        return value