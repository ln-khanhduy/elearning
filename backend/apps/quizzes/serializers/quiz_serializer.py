from rest_framework import serializers
from apps.quizzes.models import Quiz


class QuizSerializer(serializers.ModelSerializer):
    """Serializer cho quiz - bao gồm thông tin lesson và trạng thái."""

    class Meta:
        model = Quiz
        fields = [
            "id", "lesson", "title", "description", "time_limit_minutes",
            "passing_score", "status", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "lesson", "created_at", "updated_at"]


class QuizCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer cho tạo/cập nhật quiz - validate title, passing_score và status."""

    title = serializers.CharField(min_length=3, max_length=100, trim_whitespace=True)

    class Meta:
        model = Quiz
        fields = ["title", "description", "time_limit_minutes", "passing_score", "status"]

    def validate_passing_score(self, value):
        """Kiểm tra passing_score >= 0."""
        if value < 0:
            raise serializers.ValidationError("Điểm đạt không được âm.")
        return value

    def validate_status(self, value):
        """Kiểm tra status hợp lệ."""
        allowed_statuses = ["IN_PROCESS", "ACTIVE", "INACTIVE"]
        if value not in allowed_statuses:
            raise serializers.ValidationError(f"Trạng thái không hợp lệ. Chấp nhận: {', '.join(allowed_statuses)}")
        return value
