from rest_framework import serializers
from apps.courses.models import CourseQuestion, CourseAnswer


class CourseAnswerSerializer(serializers.ModelSerializer):
    """Serializer cho câu trả lời Q&A."""
    author_name = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()

    class Meta:
        model = CourseAnswer
        fields = [
            'id', 'question', 'author', 'author_name', 'author_avatar',
            'content', 'is_instructor', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'author', 'author_name', 'author_avatar',
                            'is_instructor', 'created_at', 'updated_at']

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.email

    def get_author_avatar(self, obj):
        return obj.author.avatar_url if hasattr(obj.author, 'avatar_url') else None


class CourseQuestionListSerializer(serializers.ModelSerializer):
    """Serializer cho danh sách câu hỏi Q&A (không kèm câu trả lời chi tiết)."""
    student_name = serializers.SerializerMethodField()
    student_avatar = serializers.SerializerMethodField()
    lesson_title = serializers.SerializerMethodField()
    answer_count = serializers.SerializerMethodField()
    last_answered_at = serializers.SerializerMethodField()

    class Meta:
        model = CourseQuestion
        fields = [
            'id', 'course', 'student', 'student_name', 'student_avatar',
            'lesson', 'lesson_title', 'title', 'content', 'status',
            'answer_count', 'last_answered_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'student', 'student_name', 'student_avatar',
                            'answer_count', 'last_answered_at', 'created_at', 'updated_at']

    def get_student_name(self, obj):
        return obj.student.get_full_name() or obj.student.email

    def get_student_avatar(self, obj):
        return obj.student.avatar_url if hasattr(obj.student, 'avatar_url') else None

    def get_lesson_title(self, obj):
        return obj.lesson.title if obj.lesson else None

    def get_answer_count(self, obj):
        return obj.answers.count()

    def get_last_answered_at(self, obj):
        last_answer = obj.answers.order_by('-created_at').first()
        return last_answer.created_at if last_answer else None


class CourseQuestionDetailSerializer(serializers.ModelSerializer):
    """Serializer cho chi tiết câu hỏi Q&A (kèm danh sách câu trả lời)."""
    student_name = serializers.SerializerMethodField()
    student_avatar = serializers.SerializerMethodField()
    lesson_title = serializers.SerializerMethodField()
    answers = CourseAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = CourseQuestion
        fields = [
            'id', 'course', 'student', 'student_name', 'student_avatar',
            'lesson', 'lesson_title', 'title', 'content', 'status',
            'answers', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'student', 'student_name', 'student_avatar',
                            'answers', 'created_at', 'updated_at']

    def get_student_name(self, obj):
        return obj.student.get_full_name() or obj.student.email

    def get_student_avatar(self, obj):
        return obj.student.avatar_url if hasattr(obj.student, 'avatar_url') else None

    def get_lesson_title(self, obj):
        return obj.lesson.title if obj.lesson else None


class CourseQuestionCreateSerializer(serializers.ModelSerializer):
    """Serializer cho tạo câu hỏi mới."""

    class Meta:
        model = CourseQuestion
        fields = ['course', 'lesson', 'title', 'content']

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Tiêu đề không được để trống.")
        return value.strip()

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Nội dung không được để trống.")
        return value.strip()


class CourseAnswerCreateSerializer(serializers.ModelSerializer):
    """Serializer cho tạo câu trả lời mới."""

    class Meta:
        model = CourseAnswer
        fields = ['content']

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Nội dung trả lời không được để trống.")
        return value.strip()
