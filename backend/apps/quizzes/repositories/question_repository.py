from rest_framework.exceptions import NotFound
from apps.quizzes.models import Question, QuestionOption


class QuestionRepository:
    @staticmethod
    def get_by_id(question_id):
        """Lấy chi tiết một câu hỏi theo ID, kèm thông tin quiz. Trả về 404 nếu không tìm thấy."""
        question = Question.objects.select_related("quiz", "quiz__lesson").filter(id=question_id).first()
        if not question:
            raise NotFound("Không tìm thấy câu hỏi.")
        return question

    @staticmethod
    def get_by_quiz(quiz_id):
        """Lấy danh sách câu hỏi của một quiz, kèm options, sắp xếp theo order."""
        return Question.objects.filter(quiz_id=quiz_id).order_by("order", "id").prefetch_related("options")

    @staticmethod
    def create(data):
        """Tạo một câu hỏi mới với dữ liệu đã được validate."""
        return Question.objects.create(**data)

    @staticmethod
    def update(question_id, data):
        """Cập nhật câu hỏi."""
        question = QuestionRepository.get_by_id(question_id)
        for key, value in data.items():
            setattr(question, key, value)
        question.save()
        return question

    @staticmethod
    def delete(question_id):
        """Xóa câu hỏi (các QuestionOption liên quan sẽ tự động xóa theo cascade)."""
        question = QuestionRepository.get_by_id(question_id)
        question.delete()

    @staticmethod
    def get_options(question_id):
        """Lấy danh sách options của một câu hỏi."""
        return QuestionOption.objects.filter(question_id=question_id).order_by("order", "id")

    @staticmethod
    def create_option(data):
        """Tạo một option mới cho câu hỏi."""
        return QuestionOption.objects.create(**data)

    @staticmethod
    def update_option(option_id, data):
        """Cập nhật option."""
        option = QuestionOption.objects.filter(id=option_id).first()
        if not option:
            raise NotFound("Không tìm thấy đáp án.")
        for key, value in data.items():
            setattr(option, key, value)
        option.save()
        return option

    @staticmethod
    def delete_option(option_id):
        """Xóa option."""
        option = QuestionOption.objects.filter(id=option_id).first()
        if not option:
            raise NotFound("Không tìm thấy đáp án.")
        option.delete()

    @staticmethod
    def delete_options_by_question(question_id):
        """Xóa tất cả options của một câu hỏi."""
        QuestionOption.objects.filter(question_id=question_id).delete()
