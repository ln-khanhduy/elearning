from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.lessons.repositories.lesson_repository import LessonRepository
from apps.quizzes.repositories.quiz_repository import QuizRepository


class QuizService:
    @staticmethod
    def check_course_owner(course, user):
        """Kiểm tra user có phải là chủ sở hữu khóa học không. SUPERADMIN luôn được phép."""
        if user.role and user.role.code == "SUPERADMIN":
            return
        if course.instructor_id != user.id:
            raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    @staticmethod
    def get_quizzes_by_lesson(lesson_id):
        """Lấy danh sách quiz của một bài học (ủy quyền cho Repository truy vấn)."""
        return QuizRepository.get_by_lesson(lesson_id)

    @staticmethod
    def get_quiz_detail(quiz_id):
        """Lấy thông tin chi tiết của một quiz (ủy quyền cho Repository truy vấn)."""
        return QuizRepository.get_by_id(quiz_id)

    @staticmethod
    def create_quiz(lesson_id, user, validated_data):
        """
        Tạo quiz mới trong một bài học.
        - Kiểm tra quyền sở hữu khóa học
        - Đặt trạng thái mặc định là IN_PROCESS
        """
        lesson = LessonRepository.get_by_id(lesson_id)
        QuizService.check_course_owner(lesson.chapter.course, user)

        validated_data["lesson"] = lesson
        validated_data.setdefault("status", "IN_PROCESS")
        return QuizRepository.create(validated_data)

    @staticmethod
    def update_quiz(quiz_id, user, validated_data):
        """
        Cập nhật thông tin quiz.
        - Kiểm tra quyền sở hữu khóa học
        """
        quiz = QuizRepository.get_by_id(quiz_id)
        QuizService.check_course_owner(quiz.lesson.chapter.course, user)

        for key, value in validated_data.items():
            setattr(quiz, key, value)

        quiz.save()
        return quiz

    @staticmethod
    def delete_quiz(quiz_id, user):
        """
        Xóa quiz.
        - Kiểm tra quyền sở hữu khóa học trước khi xóa
        """
        quiz = QuizRepository.get_by_id(quiz_id)
        QuizService.check_course_owner(quiz.lesson.chapter.course, user)
        QuizRepository.delete(quiz_id)
