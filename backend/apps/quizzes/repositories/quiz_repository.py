from rest_framework.exceptions import NotFound
from apps.quizzes.models import Quiz


class QuizRepository:
    @staticmethod
    def get_by_id(quiz_id):
        """Lấy chi tiết một quiz theo ID, kèm thông tin lesson, chapter, course. Trả về 404 nếu không tìm thấy."""
        quiz = Quiz.objects.select_related(
            "lesson", "lesson__chapter", "lesson__chapter__course",
            "lesson__chapter__course__assigned_instructor"
        ).filter(id=quiz_id).first()
        if not quiz:
            raise NotFound("Không tìm thấy bài tập.")
        return quiz

    @staticmethod
    def get_by_lesson(lesson_id):
        """Lấy danh sách quiz của một bài học."""
        return Quiz.objects.filter(lesson_id=lesson_id).order_by("-created_at")

    @staticmethod
    def create(data):
        """Tạo một quiz mới với dữ liệu đã được validate."""
        return Quiz.objects.create(**data)

    @staticmethod
    def update(quiz_id, data):
        """Cập nhật quiz."""
        quiz = QuizRepository.get_by_id(quiz_id)
        for key, value in data.items():
            setattr(quiz, key, value)
        quiz.save()
        return quiz

    @staticmethod
    def delete(quiz_id):
        """Xóa quiz."""
        quiz = QuizRepository.get_by_id(quiz_id)
        quiz.delete()
