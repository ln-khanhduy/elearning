from rest_framework import serializers
from apps.quizzes.models import Question, QuestionOption


class QuestionOptionSerializer(serializers.ModelSerializer):
    """Serializer cho đáp án của câu hỏi MCQ."""

    class Meta:
        model = QuestionOption
        fields = ["id", "text", "is_correct", "order"]
        read_only_fields = ["id"]


class QuestionPreviewSerializer(serializers.ModelSerializer):
    """
    Serializer cho preview câu hỏi - CHỈ trả về thông tin cơ bản.
    KHÔNG expose is_correct, correct_text_answer.
    Dùng cho public API (CourseCurriculumAPIView).
    """

    class Meta:
        model = Question
        fields = [
            "id", "prompt", "points", "order", "question_type",
        ]
        read_only_fields = ["id"]


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer cho câu hỏi - bao gồm options (nếu là MCQ)."""

    options = QuestionOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = [
            "id", "quiz", "prompt", "points", "order", "question_type",
            "correct_text_answer", "options", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "quiz", "created_at", "updated_at"]



class QuestionCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer cho tạo/cập nhật câu hỏi - validate points, question_type và options."""

    prompt = serializers.CharField(min_length=3, trim_whitespace=True)
    options = QuestionOptionSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ["prompt", "points", "order", "question_type", "correct_text_answer", "options"]

    def validate_points(self, value):
        """Kiểm tra points > 0."""
        if value <= 0:
            raise serializers.ValidationError("Điểm số phải lớn hơn 0.")
        return value

    def validate(self, attrs):
        """Validate phụ thuộc question_type."""
        question_type = attrs.get("question_type")
        options = attrs.get("options", [])

        if question_type == "MCQ":
            if len(options) < 2:
                raise serializers.ValidationError({"options": "Câu hỏi MCQ phải có tối thiểu 2 đáp án."})
            correct_count = sum(1 for opt in options if opt.get("is_correct"))
            if correct_count < 1:
                raise serializers.ValidationError({"options": "Câu hỏi MCQ phải có tối thiểu 1 đáp án đúng."})
            # Xóa correct_text_answer nếu có
            attrs.pop("correct_text_answer", None)

        elif question_type == "FILL_BLANK":
            correct_text = attrs.get("correct_text_answer")
            if not correct_text or not correct_text.strip():
                raise serializers.ValidationError({"correct_text_answer": "Câu hỏi điền khuyết phải có đáp án đúng."})
            # Xóa options nếu có
            attrs.pop("options", None)

        elif question_type == "ESSAY":
            # Xóa correct_text_answer và options
            attrs.pop("correct_text_answer", None)
            attrs.pop("options", None)

        return attrs
