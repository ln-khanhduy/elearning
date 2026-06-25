"""
CurriculumService - Service xây dựng dữ liệu curriculum cho khóa học.
"""
from apps.courses.services.course_service import CourseService
from apps.courses.serializers.course_serializer import CourseDetailSerializer
from apps.lessons.repositories.chapter_repository import ChapterRepository
from apps.lessons.repositories.lesson_repository import LessonRepository
from apps.lessons.serializers.chapter_serializer import ChapterSerializer
from apps.lessons.serializers.lesson_serializer import LessonPreviewSerializer
from apps.quizzes.repositories.quiz_repository import QuizRepository
from apps.quizzes.serializers.quiz_serializer import QuizPreviewSerializer
from apps.lessons.serializers.lesson_serializer import LessonSerializer
from apps.quizzes.repositories.question_repository import QuestionRepository
from apps.quizzes.serializers.quiz_serializer import QuizSerializer


class CurriculumService:
    """Service xây dựng curriculum data cho public preview và admin/instructor preview."""

    @staticmethod
    def build_question_data(questions):
        """
        Build data câu hỏi - KHÔNG expose is_correct.
        Chỉ expose correct_text_answer cho FILL_BLANK (cần cho instructor panel).
        """
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
            # Chỉ expose correct_text_answer cho FILL_BLANK (cần cho instructor panel)
            if q.question_type == "FILL_BLANK":
                question_data["correct_text_answer"] = q.correct_text_answer or ""
            questions_data.append(question_data)
        return questions_data

    @staticmethod
    def build_public_curriculum(course_id):
        """
        Xây dựng curriculum public - chỉ hiển thị thông tin cơ bản.
        Quiz: CHỈ id, title, question_count (KHÔNG trả questions).
        """
       

        course = CourseService.get_course_detail(course_id)
        course_data = CourseDetailSerializer(course).data

        chapters = ChapterRepository.get_by_course(course_id)
        chapters_data = []
        for chapter in chapters:
            chapter_data = ChapterSerializer(chapter).data
            lessons = LessonRepository.get_by_chapter(chapter.id)
            lessons_data = []
            for lesson in lessons:
                lesson_data = LessonPreviewSerializer(lesson).data
                quizzes = QuizRepository.get_by_lesson(lesson.id)
                quizzes_data = QuizPreviewSerializer(quizzes, many=True).data
                lesson_data["quizzes"] = quizzes_data
                lessons_data.append(lesson_data)
            chapter_data["lessons"] = lessons_data
            chapters_data.append(chapter_data)

        course_data["chapters"] = chapters_data
        return course_data

    @staticmethod
    def build_full_curriculum(course_id):
        """
        Xây dựng curriculum đầy đủ cho admin/instructor.
        Trả về: video_url, material_url, quiz questions/options (KHÔNG có is_correct).
        """
        

        course = CourseService.get_course_detail(course_id)
        course_data = CourseDetailSerializer(course).data

        chapters = ChapterRepository.get_by_course(course_id)
        chapters_data = []
        for chapter in chapters:
            chapter_data = ChapterSerializer(chapter).data
            lessons = LessonRepository.get_by_chapter(chapter.id)
            lessons_data = []
            for lesson in lessons:
                lesson_data = LessonSerializer(lesson).data
                quizzes = QuizRepository.get_by_lesson(lesson.id)
                quizzes_data = []
                for quiz in quizzes:
                    quiz_data = QuizSerializer(quiz).data
                    questions = QuestionRepository.get_by_quiz(quiz.id)
                    quiz_data["questions"] = CurriculumService.build_question_data(questions)
                    quizzes_data.append(quiz_data)
                lesson_data["quizzes"] = quizzes_data
                lessons_data.append(lesson_data)
            chapter_data["lessons"] = lessons_data
            chapters_data.append(chapter_data)

        course_data["chapters"] = chapters_data
        return course_data
