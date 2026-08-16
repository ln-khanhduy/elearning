"""
CurriculumRepository - Repository chứa các truy vấn ORM xây dựng dữ liệu curriculum
(chương trình giảng dạy) cho khóa học.
Được tối ưu bằng prefetch_related để loại bỏ các truy vấn N+1.
"""
from django.db.models import Prefetch

from apps.lessons.models import Lesson, Chapter
from apps.quizzes.models import Quiz, Question


def get_public_chapters(course_id):
    """Lấy danh sách chương của khóa học, kèm các bài học đã xuất bản (PUBLISHED)
    và các bài kiểm tra (quizzes) đang hoạt động (is_active=True)."""
    return Chapter.objects.filter(course_id=course_id).prefetch_related(
        Prefetch(
            "lessons",
            queryset=Lesson.objects.order_by("order", "id")
            .prefetch_related(
                Prefetch(
                    "quizzes",
                    queryset=Quiz.objects.filter(is_active=True),
                )
            ),
        )
    ).order_by("order", "id")


def get_full_chapters(course_id):
    """Lấy danh sách chương của khóa học với đầy đủ dữ liệu lồng nhau:
    Chương -> Bài học -> Bài kiểm tra -> Câu hỏi -> Lựa chọn trả lời (options)."""
    return Chapter.objects.filter(course_id=course_id).prefetch_related(
        Prefetch(
            "lessons",
            queryset=Lesson.objects.order_by("order", "id").prefetch_related(
                Prefetch(
                    "quizzes",
                    queryset=Quiz.objects.prefetch_related(
                        Prefetch(
                            "questions",
                            queryset=Question.objects.prefetch_related(
                                "options"
                            ).order_by("order", "id"),
                        )
                    ),
                )
            ),
        )
    ).order_by("order", "id")