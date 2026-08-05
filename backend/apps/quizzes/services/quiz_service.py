from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.lessons.repositories import lesson_repository
from apps.quizzes.repositories import quiz_repository
from apps.courses.services.course_permission_service import can_manage_course


def get_quizzes_by_lesson(lesson_id):
    """Lấy danh sách bài kiểm tra của một bài học."""
    return quiz_repository.get_by_lesson(lesson_id)


def get_quiz_detail(quiz_id):
    """Lấy chi tiết bài kiểm tra theo ID."""
    return quiz_repository.get_by_id(quiz_id)


def create_quiz(lesson_id, user, validated_data):
    """Tạo mới một bài kiểm tra cho bài học.

    - Kiểm tra quyền quản lý khóa học của user, nếu không có quyền sẽ báo lỗi PermissionDenied.
    - Trạng thái mặc định là IN_PROCESS, loại bài kiểm tra mặc định là MCQ.
    """
    lesson = lesson_repository.get_by_id(lesson_id)

    if not can_manage_course(lesson.chapter.course, user):
        raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    validated_data["lesson"] = lesson
    validated_data.setdefault("status", "IN_PROCESS")
    validated_data.setdefault("quiz_type", "MCQ")
    return quiz_repository.create(validated_data)


def update_quiz(quiz_id, user, validated_data):
    """Cập nhật thông tin một bài kiểm tra.

    - Kiểm tra quyền quản lý khóa học của user, nếu không có quyền sẽ báo lỗi PermissionDenied.
    """
    quiz = quiz_repository.get_by_id(quiz_id)

    if not can_manage_course(quiz.lesson.chapter.course, user):
        raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    for key, value in validated_data.items():
        setattr(quiz, key, value)

    quiz.save()
    return quiz


def delete_quiz(quiz_id, user):
    """Xóa một bài kiểm tra.

    - Kiểm tra quyền quản lý khóa học của user, nếu không có quyền sẽ báo lỗi PermissionDenied.
    """
    quiz = quiz_repository.get_by_id(quiz_id)

    if not can_manage_course(quiz.lesson.chapter.course, user):
        raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    quiz_repository.delete(quiz_id)