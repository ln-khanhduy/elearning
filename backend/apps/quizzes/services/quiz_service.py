from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.lessons.repositories import lesson_repository
from apps.quizzes.repositories import quiz_repository
from apps.courses.services.course_permission_service import can_manage_course


def get_quizzes_by_lesson(lesson_id):
    return quiz_repository.get_by_lesson(lesson_id)


def get_quiz_detail(quiz_id):
    return quiz_repository.get_by_id(quiz_id)


def create_quiz(lesson_id, user, validated_data):
    lesson = lesson_repository.get_by_id(lesson_id)

    if not can_manage_course(lesson.chapter.course, user):
        raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    validated_data["lesson"] = lesson
    validated_data.setdefault("status", "IN_PROCESS")
    validated_data.setdefault("quiz_type", "MCQ")
    return quiz_repository.create(validated_data)


def update_quiz(quiz_id, user, validated_data):
    quiz = quiz_repository.get_by_id(quiz_id)

    if not can_manage_course(quiz.lesson.chapter.course, user):
        raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    for key, value in validated_data.items():
        setattr(quiz, key, value)

    quiz.save()
    return quiz


def delete_quiz(quiz_id, user):
    quiz = quiz_repository.get_by_id(quiz_id)

    if not can_manage_course(quiz.lesson.chapter.course, user):
        raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    quiz_repository.delete(quiz_id)