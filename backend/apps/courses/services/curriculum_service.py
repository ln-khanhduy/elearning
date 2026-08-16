"""
CurriculumService - Service xây dựng dữ liệu chương trình giảng dạy (curriculum) cho khóa học.
Được tối ưu bằng prefetch_related để loại bỏ các truy vấn N+1.
"""
from apps.courses.repositories import curriculum_repository
from apps.courses.services.course_service import get_course_detail
from apps.courses.serializers.course_serializer import CourseDetailSerializer
from apps.lessons.serializers.chapter_serializer import ChapterSerializer
from apps.lessons.serializers.lesson_serializer import LessonPreviewSerializer, LessonSerializer
from apps.quizzes.serializers.quiz_serializer import QuizPreviewSerializer, QuizSerializer


def _build_question_data(questions):
    """
    Xây dựng dữ liệu câu hỏi từ danh sách các đối tượng Question.
    Yêu cầu các câu hỏi đã được prefetch phần options (các lựa chọn trả lời).
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


def build_public_curriculum(course_id: int) -> dict:
    """
    Xây dựng dữ liệu chương trình giảng dạy công khai (public) cho khóa học.
    Chỉ bao gồm các bài học đã xuất bản (PUBLISHED).
    Được tối ưu: sử dụng prefetch_related để tránh các truy vấn N+1.
    """
    course = get_course_detail(course_id)
    course_data = CourseDetailSerializer(course).data

    # Repository: Chapters -> PUBLISHED Lessons -> Quizzes
    chapters = curriculum_repository.get_public_chapters(course_id)

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


def build_full_curriculum(course_id: int, sign_video: bool = False) -> dict:
    """
    Xây dựng dữ liệu chương trình giảng dạy đầy đủ cho khóa học (bao gồm tất cả bài học và chi tiết bài kiểm tra).
    Được sử dụng bởi quản trị viên/giảng viên khóa học.
    Được tối ưu: sử dụng prefetch_related để tránh các truy vấn N+1.

    - sign_video=True (user đã được authorization): trả SIGNED video URL runtime.
    - sign_video=False (mặc định): trả URL KHÔNG token (an toàn cho editor).
    """
    course = get_course_detail(course_id)
    course_data = CourseDetailSerializer(course).data

    chapters = curriculum_repository.get_full_chapters(course_id)

    context = {"sign_video": True} if sign_video else {}
    chapters_data = []
    for chapter in chapters:
        chapter_data = ChapterSerializer(chapter).data
        lessons_data = []
        for lesson in chapter.lessons.all():
            lesson_data = LessonSerializer(lesson, context=context).data
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