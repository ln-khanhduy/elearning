from rest_framework import serializers
from apps.reviews.models import Review


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer cho Review - bao gồm thông tin user và course."""
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id", "course", "course_title", "user", "user_name",
            "parent", "rating", "content", "status",
            "created_at", "updated_at", "edited_at",
        ]
        read_only_fields = ["id", "user", "status", "created_at", "updated_at", "edited_at"]


class ReviewCreateSerializer(serializers.Serializer):
    """Serializer cho tạo review mới."""
    course_id = serializers.IntegerField(required=True)
    rating = serializers.IntegerField(required=True, min_value=1, max_value=5)
    content = serializers.CharField(required=True, allow_blank=False, max_length=2000)
    parent = serializers.IntegerField(required=False, allow_null=True)


class ReviewStatusSerializer(serializers.Serializer):
    """Serializer cho cập nhật trạng thái review."""
    status = serializers.ChoiceField(choices=["PUBLISHED", "HIDDEN", "DELETED"], required=True)
