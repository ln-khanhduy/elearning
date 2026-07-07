from rest_framework import serializers
from apps.reviews.models import Review


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer cho Review - bao gồm thông tin user và course."""
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    user_avatar = serializers.SerializerMethodField()
    course_title = serializers.CharField(source="course.title", read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id", "course", "course_title", "user", "user_name", "user_avatar",
            "parent", "rating", "content", "status",
            "created_at", "updated_at", "edited_at", "replies",
        ]
        read_only_fields = ["id", "user", "status", "created_at", "updated_at", "edited_at"]

    def get_user_avatar(self, obj):
        """Lấy URL avatar của user đánh giá, trả về None nếu không có."""
        return obj.user.avatar_url if hasattr(obj.user, 'avatar_url') else None

    def get_replies(self, obj):
        """Lấy các phản hồi cho review này."""
        if hasattr(obj, '_prefetched_replies') and obj._prefetched_replies:
            return ReviewSerializer(obj._prefetched_replies, many=True).data
        return []


class ReviewCreateSerializer(serializers.Serializer):
    """Serializer cho tạo review mới."""
    course_id = serializers.IntegerField(required=True)
    rating = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=5)
    content = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    parent = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, attrs):
        has_rating = attrs.get("rating") is not None and attrs.get("rating") > 0
        has_content = attrs.get("content") and attrs.get("content").strip()
        if not attrs.get("parent") and not has_rating and not has_content:
            raise serializers.ValidationError("Vui lòng đánh giá sao hoặc nhập nội dung.")
        return attrs


class ReviewUpdateSerializer(serializers.Serializer):
    """Serializer cho cập nhật review."""
    rating = serializers.IntegerField(required=False, min_value=1, max_value=5)
    content = serializers.CharField(required=False, allow_blank=True, max_length=2000)


class ReviewStatusSerializer(serializers.Serializer):
    """Serializer cho cập nhật trạng thái review."""
    status = serializers.ChoiceField(choices=["PUBLISHED", "HIDDEN", "DELETED"], required=True)