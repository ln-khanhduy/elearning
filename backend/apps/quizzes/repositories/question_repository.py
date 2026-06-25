from apps.quizzes.models import Question, QuestionOption


class QuestionRepository:
    """
    Repository quản lý câu hỏi.
    """

    @staticmethod
    def get_by_id(question_id):
        """Lấy câu hỏi theo ID (dùng cho service hiện tại)."""
        return Question.objects.filter(id=question_id).select_related('quiz__lesson__chapter__course').prefetch_related('options').first()

    @staticmethod
    def get_by_quiz(quiz_id):
        """Lấy danh sách câu hỏi của một quiz (dùng cho service hiện tại)."""
        return Question.objects.filter(quiz_id=quiz_id).select_related('quiz').prefetch_related('options').order_by('order', 'id')

    @staticmethod
    def get_questions_by_quiz(quiz_id):
        """Lấy danh sách câu hỏi của một quiz."""
        return Question.objects.filter(quiz_id=quiz_id).select_related('quiz').prefetch_related('options').order_by('order', 'id')

    @staticmethod
    def get_question_by_id(question_id):
        """Lấy câu hỏi theo ID."""
        return Question.objects.filter(id=question_id).select_related('quiz').prefetch_related('options').first()

    @staticmethod
    def get_question_count_by_quiz(quiz_id):
        """Đếm số câu hỏi của một quiz."""
        return Question.objects.filter(quiz_id=quiz_id).count()

    @staticmethod
    def get_question_count_by_quiz_and_type(quiz_id, question_type):
        """Đếm số câu hỏi của một quiz theo loại câu hỏi."""
        return Question.objects.filter(quiz_id=quiz_id, question_type=question_type).count()

    @staticmethod
    def create(validated_data):
        """Tạo câu hỏi mới (dùng cho service hiện tại)."""
        return Question.objects.create(**validated_data)

    @staticmethod
    def create_option(validated_data):
        """Tạo đáp án mới (dùng cho service hiện tại)."""
        return QuestionOption.objects.create(**validated_data)

    @staticmethod
    def delete_options_by_question(question_id):
        """Xóa tất cả đáp án của một câu hỏi (dùng cho service hiện tại)."""
        return QuestionOption.objects.filter(question_id=question_id).delete()

    @staticmethod
    def delete(question_id):
        """Xóa câu hỏi (dùng cho service hiện tại)."""
        return Question.objects.filter(id=question_id).delete()

    @staticmethod
    def delete_question(question_id):
        """Xóa câu hỏi."""
        return Question.objects.filter(id=question_id).delete()

    @staticmethod
    def bulk_create_questions(questions):
        """Tạo nhiều câu hỏi cùng lúc."""
        return Question.objects.bulk_create(questions)

    @staticmethod
    def bulk_create_options(options):
        """Tạo nhiều đáp án cùng lúc."""
        return QuestionOption.objects.bulk_create(options)
