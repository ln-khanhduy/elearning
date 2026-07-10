"""
CurriculumService - Service xây dựng dữ liệu curriculum cho khóa học.
"""
from apps.courses.services.course_service import get_course_detail
from apps.courses.serializers.course_serializer import CourseDetailSerializer
from apps.lessons.repositories import chapter_repository
from apps.lessons.repositories import lesson_repository
from apps.lessons.serializers.chapter_serializer import ChapterSerializer
from apps.lessons.serializers.lesson_serializer import LessonPreviewSerializer
from apps.quizzes.repositories import quiz_repository
from apps.quizzes.serializers.quiz_serializer import QuizPreviewSerializer
from apps.lessons.serializers.lesson_serializer import LessonSerializer
from apps.quizzes.repositories import question_repository
from apps.quizzes.serializers.quiz_serializer import QuizSerializer


def build_question_data(questions):
    questions_data = []
    for q in questions:
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


def build_public_curriculum(course_id):
    course = get_course_detail(course_id)
    course_data = CourseDetailSerializer(course).data
    chapters = chapter_repository.get_by_course(course_id)
    chapters_data = []
    for chapter in chapters:
        chapter_data = ChapterSerializer(chapter).data
        lessons = lesson_repository.get_by_chapter(chapter.id).filter(status="PUBLISHED")
        lessons_data = []
        for lesson in lessons:
            lesson_data = LessonPreviewSerializer(lesson).data
            quizzes = quiz_repository.get_by_lesson(lesson.id)
            quizzes_data = QuizPreviewSerializer(quizzes, many=True).data
            lesson_data["quizzes"] = quizzes_data
            lessons_data.append(lesson_data)
        chapter_data["lessons"] = lessons_data
        chapters_data.append(chapter_data)
    course_data["chapters"] = chapters_data
    return course_data


def build_full_curriculum(course_id):
    course = get_course_detail(course_id)
    course_data = CourseDetailSerializer(course).data
    chapters = chapter_repository.get_by_course(course_id)
    chapters_data = []
    for chapter in chapters:
        chapter_data = ChapterSerializer(chapter).data
        lessons = lesson_repository.get_by_chapter(chapter.id)
        lessons_data = []
        for lesson in lessons:
            lesson_data = LessonSerializer(lesson).data
            quizzes = quiz_repository.get_by_lesson(lesson.id)
            quizzes_data = []
            for quiz in quizzes:
                quiz_data = QuizSerializer(quiz).data
                questions = question_repository.get_by_quiz(quiz.id)
                quiz_data["questions"] = build_question_data(questions)
                quizzes_data.append(quiz_data)
            lesson_data["quizzes"] = quizzes_data
            lessons_data.append(lesson_data)
        chapter_data["lessons"] = lessons_data
        chapters_data.append(chapter_data)
    course_data["chapters"] = chapters_data
    return course_data