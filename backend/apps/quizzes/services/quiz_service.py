from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.lessons.repositories.lesson_repository import LessonRepository
from apps.quizzes.repositories.quiz_repository import QuizRepository
from apps.courses.services.course_permission_service import CoursePermissionService


class QuizService:
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
        - Kiểm tra quyền quản lý khóa học (chỉ COURSE_ADMIN/SUPERADMIN)
        - Đặt trạng thái mặc định là IN_PROCESS
        """
        lesson = LessonRepository.get_by_id(lesson_id)

        if not CoursePermissionService.can_manage_course(lesson.chapter.course, user):
            raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

        validated_data["lesson"] = lesson
        validated_data.setdefault("status", "IN_PROCESS")
        return QuizRepository.create(validated_data)

    @staticmethod
    def update_quiz(quiz_id, user, validated_data):
        """
        Cập nhật thông tin quiz.
        - Kiểm tra quyền quản lý khóa học (chỉ COURSE_ADMIN/SUPERADMIN)
        """
        quiz = QuizRepository.get_by_id(quiz_id)

        if not CoursePermissionService.can_manage_course(quiz.lesson.chapter.course, user):
            raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

        for key, value in validated_data.items():
            setattr(quiz, key, value)

        quiz.save()
        return quiz

    @staticmethod
    def delete_quiz(quiz_id, user):
        """
        Xóa quiz.
        - Kiểm tra quyền quản lý khóa học trước khi xóa (chỉ COURSE_ADMIN/SUPERADMIN)
        """
        quiz = QuizRepository.get_by_id(quiz_id)

        if not CoursePermissionService.can_manage_course(quiz.lesson.chapter.course, user):
            raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

        QuizRepository.delete(quiz_id)
