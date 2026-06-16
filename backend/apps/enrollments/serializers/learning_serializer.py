from rest_framework import serializers
from apps.enrollments.models import LessonProgress, CourseProgress
from apps.lessons.models import Chapter, Lesson
from apps.quizzes.models import Quiz, Question, QuestionOption


class LessonProgressSerializer(serializers.ModelSerializer):
    """Serializer cho tiến độ bài học chi tiết."""

    class Meta:
        model = LessonProgress
        fields = ["id", "enrollment", "lesson", "completed", "completed_at", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class CourseProgressSerializer(serializers.ModelSerializer):
    """Serializer cho tiến độ tổng hợp khóa học."""

    class Meta:
        model = CourseProgress
        fields = [
            "id", "enrollment", "completed_lessons_count", "total_lessons_count",
            "progress_percent", "last_completed_lesson", "started_at",
            "last_activity_at", "completed_at",
        ]
        read_only_fields = ["id"]


class QuestionOptionSerializer(serializers.ModelSerializer):
    """Serializer cho đáp án MCQ - chỉ expose text và id, không expose is_correct."""

    class Meta:
        model = QuestionOption
        fields = ["id", "text", "order"]


class QuestionLearningSerializer(serializers.ModelSerializer):
    """Serializer cho câu hỏi trong learning - expose options (không is_correct)."""
    options = QuestionOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "prompt", "points", "order", "question_type", "options"]
        read_only_fields = ["id"]


class QuizLearningSerializer(serializers.ModelSerializer):
    """Serializer cho quiz trong learning - bao gồm câu hỏi."""
    questions = QuestionLearningSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ["id", "title", "description", "time_limit_minutes", "passing_score", "questions"]
        read_only_fields = ["id"]


class LessonLearningSerializer(serializers.ModelSerializer):
    """Serializer cho bài học trong learning - bao gồm quizzes."""
    quizzes = QuizLearningSerializer(many=True, read_only=True)
    completed = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = Lesson
        fields = [
            "id", "slug", "title", "description", "content_type",
            "video_url", "material_url", "order", "is_free",
            "quizzes", "completed",
        ]


class ChapterLearningSerializer(serializers.ModelSerializer):
    """Serializer cho chương học trong learning - bao gồm bài học."""
    lessons = serializers.SerializerMethodField()

    class Meta:
        model = Chapter
        fields = ["id", "title", "description", "order", "lessons"]

    def get_lessons(self, obj):
        """Lấy danh sách bài học, chỉ lấy PUBLISHED."""
        lessons = obj.lessons.filter(status="PUBLISHED").order_by("order", "id")
        return LessonLearningSerializer(lessons, many=True).data


class MarkLessonCompleteSerializer(serializers.Serializer):
    """Serializer cho đánh dấu hoàn thành bài học."""
    lesson_id = serializers.IntegerField(required=True)

    def validate_lesson_id(self, value):
        if value <= 0:
            raise serializers.ValidationError("ID bài học không hợp lệ.")
        return value


class QuizSubmitSerializer(serializers.Serializer):
    """Serializer cho nộp bài quiz."""
    quiz_id = serializers.IntegerField(required=True)
    answers = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        allow_empty=False,
    )
