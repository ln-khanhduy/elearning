from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError

from apps.enrollments.services.learning_service import LearningService
from apps.enrollments.serializers.learning_serializer import (
    MarkLessonCompleteSerializer,
    QuizSubmitSerializer,
)



def success_response(data=None, message="Success", http_status=status.HTTP_200_OK):
    return Response({
        "success": True,
        "message": message,
        "data": data,
    }, status=http_status)


def error_response(message="Error", errors=None, http_status=status.HTTP_400_BAD_REQUEST):
    return Response({
        "success": False,
        "message": message,
        "errors": errors or {},
    }, status=http_status)


class LearningCurriculumAPIView(APIView):
    """
    GET /api/learning/courses/{course_id}/curriculum/
    Lấy toàn bộ curriculum cho learning page.
    Yêu cầu: user đã đăng nhập và đã enroll khóa học.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        try:
            data = LearningService.get_learning_curriculum(request.user, course_id)
            return success_response(data)
        except PermissionDenied:
            return error_response("Bạn cần đăng ký khóa học trước khi học.", http_status=status.HTTP_403_FORBIDDEN)
        except NotFound as e:
            return error_response(str(e), http_status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return error_response("Đã xảy ra lỗi khi tải nội dung khóa học.", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class MarkLessonCompleteAPIView(APIView):
    """
    POST /api/learning/courses/{course_id}/lessons/complete/
    Đánh dấu bài học đã hoàn thành.
    Body: { "lesson_id": 123 }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id):
        serializer = MarkLessonCompleteSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Dữ liệu không hợp lệ", serializer.errors, status.HTTP_400_BAD_REQUEST)

        try:
            result = LearningService.mark_lesson_complete(
                request.user, course_id, serializer.validated_data["lesson_id"]
            )
            return success_response(result, "Đánh dấu hoàn thành bài học thành công.")
        except PermissionDenied:
            return error_response("Bạn cần đăng ký khóa học trước khi học.", http_status=status.HTTP_403_FORBIDDEN)
        except NotFound as e:
            return error_response(str(e), http_status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return error_response("Đã xảy ra lỗi khi đánh dấu hoàn thành.", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SubmitQuizAPIView(APIView):
    """
    POST /api/learning/courses/{course_id}/quizzes/submit/
    Nộp bài quiz và chấm điểm.
    Body: { "quiz_id": 1, "answers": [{"question_id": 1, "selected_option_id": 2}, ...] }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id):
        serializer = QuizSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Dữ liệu không hợp lệ", serializer.errors, status.HTTP_400_BAD_REQUEST)

        try:
            result = LearningService.submit_quiz(
                request.user,
                course_id,
                serializer.validated_data["quiz_id"],
                serializer.validated_data["answers"],
            )
            return success_response(result, "Nộp bài kiểm tra thành công.")
        except PermissionDenied:
            return error_response("Bạn cần đăng ký khóa học trước khi học.", http_status=status.HTTP_403_FORBIDDEN)
        except NotFound as e:
            return error_response(str(e), http_status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return error_response("Đã xảy ra lỗi khi nộp bài kiểm tra.", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CompleteCourseAPIView(APIView):
    """
    POST /api/learning/courses/{course_id}/complete/
    Hoàn thành khóa học và cấp chứng chỉ.
    Yêu cầu: user đã đăng nhập, đã enroll, và progress >= 100%.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id):
        try:
            result = LearningService.complete_course(request.user, course_id)
            return success_response(result, "Hoàn thành khóa học thành công. Chứng chỉ đã được cấp.")
        except PermissionDenied:
            return error_response("Bạn cần đăng ký khóa học trước khi học.", http_status=status.HTTP_403_FORBIDDEN)
        except ValidationError as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)
        except NotFound as e:
            return error_response(str(e), http_status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return error_response("Đã xảy ra lỗi khi hoàn thành khóa học.", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)


