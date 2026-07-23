"""
CurriculumService - Service xây dựng dữ liệu curriculum cho khóa học.
Optimized with prefetch_related to eliminate N+1 queries.
"""
from django.db.models import Prefetch

from apps.courses.services.course_service import get_course_detail
from apps.courses.serializers.course_serializer import CourseDetailSerializer
from apps.lessons.models import Lesson, Chapter
from apps.lessons.serializers.chapter_serializer import ChapterSerializer
from apps.lessons.serializers.lesson_serializer import LessonPreviewSerializer, LessonSerializer
from apps.quizzes.models import Quiz, Question, QuestionOption
from apps.quizzes.serializers.quiz_serializer import QuizPreviewSerializer, QuizSerializer


def _build_question_data(questions):
    """
    Build question data dict from a list of Question objects.
    Expects questions to have their options prefetched.
    """
    questions_data = []
    for q in questions:
        # q.options.all() uses prefetched options if available
        options = q.options.all().order_by("order", "id")
        options_data = [
            {"id": opt.id, "text": opt.text, "order": opt.order}
            for opt in options
        ]
        question_data = {
            "id": q.id,
            "prompt": q.prompt,
            "points": float(q.points),
            "order": q.order,
            "question_type": q.question_type,
            "options": options_data,
        }
        if q.question_type == "FILL_BLANK":
            question_data["correct_text_answer"] = q.correct_text_answer or ""
        questions_data.append(question_data)
    return questions_data


def _get_chapter_prefetch(lesson_qs: Lesson, quiz_prefetch: Prefetch | None = None) -> Prefetch:
    """Create a Prefetch for Chapter with nested lessons and quizzes."""
    if quiz_prefetch:
        return Prefetch(
            "chapters",
            queryset=Chapter.objects.prefetch_related(
                Prefetch(
                    "lessons",
                    queryset=lesson_qs.prefetch_related(quiz_prefetch),
                )
            ).order_by("order", "id"),
        )
    return Prefetch(
        "chapters",
        queryset=Chapter.objects.prefetch_related(
            Prefetch("lessons", queryset=lesson_qs)
        ).order_by("order", "id"),
    )


def build_public_curriculum(course_id: int) -> dict:
    """
    Build public curriculum data for a course.
    Only includes PUBLISHED lessons.
    Optimized: uses prefetch_related to avoid N+1 queries.
    """
    course = get_course_detail(course_id)
    course_data = CourseDetailSerializer(course).data

    # Prefetch: Chapters -> PUBLISHED Lessons -> Quizzes
    chapters = Chapter.objects.filter(course_id=course_id).prefetch_related(
        Prefetch(
            "lessons",
            queryset=Lesson.objects.filter(status=Lesson.Status.PUBLISHED)
            .order_by("order", "id")
            .prefetch_related(
                Prefetch(
                    "quizzes",
                    queryset=Quiz.objects.filter(is_active=True),
                )
            ),
        )
    ).order_by("order", "id")

    chapters_data = []
    for chapter in chapters:
        chapter_data = ChapterSerializer(chapter).data
        lessons_data = []
        for lesson in chapter.lessons.all():
            lesson_data = LessonPreviewSerializer(lesson).data
            quizzes = lesson.quizzes.all()
            lesson_data["quizzes"] = QuizPreviewSerializer(quizzes, many=True).data
            lessons_data.append(lesson_data)
        chapter_data["lessons"] = lessons_data
        chapters_data.append(chapter_data)
    course_data["chapters"] = chapters_data
    return course_data


def build_full_curriculum(course_id: int) -> dict:
    """
    Build full curriculum data for a course (includes all lessons and quiz details).
    Used by course admin/instructor.
    Optimized: uses prefetch_related to avoid N+1 queries.
    """
    course = get_course_detail(course_id)
    course_data = CourseDetailSerializer(course).data

    # Prefetch: Chapters -> Lessons -> Quizzes -> Questions -> Options
    # This reduces queries from O(N*M*K) to just 5 queries total.
    chapters = Chapter.objects.filter(course_id=course_id).prefetch_related(
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

    chapters_data = []
    for chapter in chapters:
        chapter_data = ChapterSerializer(chapter).data
        lessons_data = []
        for lesson in chapter.lessons.all():
            lesson_data = LessonSerializer(lesson).data
            quizzes_data = []
            for quiz in lesson.quizzes.all():
                quiz_data = QuizSerializer(quiz).data
                questions = quiz.questions.all()
                quiz_data["questions"] = _build_question_data(questions)
                quizzes_data.append(quiz_data)
            lesson_data["quizzes"] = quizzes_data
            lessons_data.append(lesson_data)
        chapter_data["lessons"] = lessons_data
        chapters_data.append(chapter_data)
    course_data["chapters"] = chapters_data
    return course_data