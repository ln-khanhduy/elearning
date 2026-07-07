from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.common.response_helpers import success_response, error_response
from apps.enrollments.services import learning_service
from apps.enrollments.services import enrollment_service
from apps.enrollments.serializers.enrollment_serializer import EnrollmentSerializer
from apps.enrollments.serializers.learning_serializer import (
    MarkLessonCompleteSerializer,
    QuizSubmitSerializer,
)


class MyCourseListAPIView(APIView):
    """GET /api/enrollments/my-courses/ - Lấy danh sách khóa học đã đăng ký."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        enrollments = enrollment_service.get_my_courses(request.user)
        serializer = EnrollmentSerializer(enrollments, many=True)
        return success_response(serializer.data)


class EnrollmentDetailAPIView(APIView):
    """GET /api/enrollments/{enrollment_id}/ - Lấy chi tiết một đăng ký."""
    permission_classes = [IsAuthenticated]

    def get(self, request, enrollment_id):
        enrollment = enrollment_service.get_enrollment_detail(enrollment_id)
        if enrollment.student_id != request.user.id:
            return error_response("Bạn không có quyền xem đăng ký này.", http_status=403)
        return success_response(EnrollmentSerializer(enrollment).data)


class CheckEnrolledAPIView(APIView):
    """GET /api/enrollments/check/{course_id}/ - Kiểm tra user đã đăng ký khóa học chưa."""
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        from apps.courses.models import Course
        enrollment = enrollment_service.check_enrolled(request.user, course_id)
        course = Course.objects.filter(id=course_id).first()
        is_owner = course is not None and course.created_by_id == request.user.id
        can_access = enrollment is not None or is_owner
        return success_response({
            "is_enrolled": enrollment is not None,
            "is_owner": is_owner,
            "can_access": can_access,
            "enrollment": EnrollmentSerializer(enrollment).data if enrollment else None,
        })


class LearningCurriculumAPIView(APIView):
    """GET /api/learning/courses/{course_id}/curriculum/ - Lấy curriculum cho learning page."""
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        data = learning_service.get_learning_curriculum(request.user, course_id)
        return success_response(data)


class MarkLessonCompleteAPIView(APIView):
    """POST /api/learning/courses/{course_id}/lessons/complete/ - Đánh dấu bài học đã hoàn thành."""
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id):
        serializer = MarkLessonCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = learning_service.mark_lesson_complete(
            request.user, course_id, serializer.validated_data["lesson_id"]
        )
        return success_response(result, "Đánh dấu hoàn thành bài học thành công.")


class SubmitQuizAPIView(APIView):
    """POST /api/learning/courses/{course_id}/quizzes/submit/ - Nộp bài quiz và chấm điểm."""
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id):
        serializer = QuizSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = learning_service.submit_quiz(
            request.user, course_id,
            serializer.validated_data["quiz_id"],
            serializer.validated_data["answers"],
        )
        return success_response(result, "Nộp bài kiểm tra thành công.")


class CompleteCourseAPIView(APIView):
    """POST /api/learning/courses/{course_id}/complete/ - Hoàn thành khóa học và cấp chứng chỉ."""
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id):
        result = learning_service.complete_course(request.user, course_id)
        return success_response(result, "Hoàn thành khóa học thành công. Chứng chỉ đã được cấp.")