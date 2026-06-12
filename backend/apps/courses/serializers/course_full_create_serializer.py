from rest_framework import serializers



class QuestionOptionSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=255, allow_blank=True, default="")
    is_correct = serializers.BooleanField(default=False)
    order = serializers.IntegerField(default=0)


class QuestionSerializer(serializers.Serializer):
    question_type = serializers.ChoiceField(choices=['MCQ', 'FILL_BLANK', 'ESSAY'])
    prompt = serializers.CharField(allow_blank=True, default="")
    order = serializers.IntegerField(default=0)
    points = serializers.DecimalField(max_digits=3, decimal_places=2, default=1)
    correct_text_answer = serializers.CharField(allow_null=True, allow_blank=True, required=False)
    options = QuestionOptionSerializer(many=True, required=False)


class QuizSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, allow_blank=True, default="")
    description = serializers.CharField(allow_null=True, allow_blank=True, required=False)
    time_limit_minutes = serializers.IntegerField(allow_null=True, required=False)
    passing_score = serializers.DecimalField(max_digits=5, decimal_places=2, default=0)
    questions = QuestionSerializer(many=True, required=False)


class LessonSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=50, min_length=3)
    description = serializers.CharField(allow_null=True, allow_blank=True, required=False)
    content_type = serializers.ChoiceField(choices=['VIDEO', 'DOCUMENT'], default='VIDEO')
    material_file = serializers.FileField(allow_null=True, required=False)
    order = serializers.IntegerField(default=0)
    is_free = serializers.BooleanField(default=False)
    quizzes = QuizSerializer(many=True, required=False)


class SectionSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=50, min_length=3)
    description = serializers.CharField(allow_null=True, allow_blank=True, required=False)
    order = serializers.IntegerField(default=0)
    lessons = LessonSerializer(many=True, required=False)


class CourseFullCreateSerializer(serializers.Serializer):
    title = serializers.CharField(min_length=5, max_length=50, trim_whitespace=True)
    description = serializers.CharField(min_length=20, trim_whitespace=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    category = serializers.IntegerField()
    thumbnail = serializers.FileField(allow_null=True, required=False)
    sections = SectionSerializer(many=True, required=False)

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Tiêu đề không được trống")
        return value.strip()
