from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from apps.enrollments.services.enrollment_service import EnrollmentService
from apps.enrollments.serializers.enrollment_serializer import EnrollmentSerializer
from apps.courses.services.course_service import CourseService
from apps.courses.serializers.course_serializer import CourseDetailSerializer
from apps.lessons.repositories.chapter_repository import ChapterRepository
from apps.lessons.repositories.lesson_repository import LessonRepository
from apps.lessons.serializers.chapter_serializer import ChapterSerializer
from apps.lessons.serializers.lesson_serializer import LessonSerializer
from apps.quizzes.repositories.quiz_repository import QuizRepository
from apps.quizzes.repositories.question_repository import QuestionRepository
from apps.quizzes.serializers.quiz_serializer import QuizSerializer
from apps.quizzes.serializers.question_serializer import QuestionSerializer
from apps.enrollments.models import Enrollment


class MyCourseListAPIView(APIView):
    """
    GET /api/enrollments/my-courses/ - Lấy danh sách khóa học đã đăng ký của user hiện tại.
    Yêu cầu đăng nhập.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        enrollments = EnrollmentService.get_my_courses(request.user)
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EnrollmentDetailAPIView(APIView):
    """
    GET /api/enrollments/{enrollment_id}/ - Lấy chi tiết một đăng ký khóa học.
    Yêu cầu đăng nhập.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, enrollment_id):
        enrollment = EnrollmentService.get_enrollment_detail(enrollment_id)
        if enrollment.student_id != request.user.id:
            return Response({"detail": "Bạn không có quyền xem đăng ký này."}, status=status.HTTP_403_FORBIDDEN)
        return Response(EnrollmentSerializer(enrollment).data, status=status.HTTP_200_OK)


class CheckEnrolledAPIView(APIView):
    """
    GET /api/enrollments/check/{course_id}/ - Kiểm tra user đã đăng ký khóa học chưa.
    Yêu cầu đăng nhập.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        enrollment = EnrollmentService.check_enrolled(request.user, course_id)
        return Response({
            "is_enrolled": enrollment is not None,
            "enrollment": EnrollmentSerializer(enrollment).data if enrollment else None,
        }, status=status.HTTP_200_OK)


class LearningCurriculumAPIView(APIView):
    """
    GET /api/learning/courses/{course_id}/curriculum/
    Lấy curriculum đầy đủ cho học viên đã enroll.
    Yêu cầu đăng nhập và đã enroll khóa học.
    Trả về: chapters, lessons (có video_url, material_url), quizzes (có questions/options).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        # Kiểm tra enrollment
        enrollment = Enrollment.objects.filter(
            student=request.user,
            course_id=course_id,
            status__in=["ACTIVE", "COMPLETED"],
        ).first()
        if not enrollment:
            return Response(
                {"success": False, "message": "Bạn chưa đăng ký khóa học này."},
                status=status.HTTP_403_FORBIDDEN,
            )

        course = CourseService.get_course_detail(course_id)
        course_data = CourseDetailSerializer(course).data

        chapters = ChapterRepository.get_by_course(course_id)
        chapters_data = []
        for chapter in chapters:
            chapter_data = ChapterSerializer(chapter).data

            lessons = LessonRepository.get_by_chapter(chapter.id)
            lessons_data = []
            for lesson in lessons:
                # Dùng LessonSerializer đầy đủ - có video_url, material_url
                lesson_data = LessonSerializer(lesson).data

                # Trả quiz đầy đủ questions/options (KHÔNG có is_correct)
                quizzes = QuizRepository.get_by_lesson(lesson.id)
                quizzes_data = []
                for quiz in quizzes:
                    quiz_data = QuizSerializer(quiz).data
                    questions = QuestionRepository.get_by_quiz(quiz.id)
                    questions_data = QuestionSerializer(questions, many=True).data
                    quiz_data["questions"] = questions_data
                    quizzes_data.append(quiz_data)

                lesson_data["quizzes"] = quizzes_data
                lessons_data.append(lesson_data)

            chapter_data["lessons"] = lessons_data
            chapters_data.append(chapter_data)

        course_data["chapters"] = chapters_data
        return Response({
            "success": True,
            "data": course_data,
        }, status=status.HTTP_200_OK)


