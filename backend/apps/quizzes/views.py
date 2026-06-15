from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from apps.common.permissions import HasRequiredPermission
from apps.system.services.admin_log_service import AdminLogService

from apps.quizzes.services.quiz_service import QuizService
from apps.quizzes.serializers.quiz_serializer import QuizSerializer, QuizCreateUpdateSerializer

from apps.quizzes.services.question_service import QuestionService
from apps.quizzes.serializers.question_serializer import QuestionSerializer, QuestionCreateUpdateSerializer


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


# ==================== QUIZ ====================

class LessonQuizListAPIView(APIView):
    """
    GET /api/lessons/{lesson_id}/quizzes/ - Lấy danh sách quiz của một bài học.
    """
    permission_classes = [AllowAny]

    def get(self, request, lesson_id):
        quizzes = QuizService.get_quizzes_by_lesson(lesson_id)
        return success_response(QuizSerializer(quizzes, many=True).data)


class QuizDetailAPIView(APIView):
    """
    GET /api/quizzes/{quiz_id}/ - Lấy thông tin chi tiết của một quiz.
    """
    permission_classes = [AllowAny]

    def get(self, request, quiz_id):
        quiz = QuizService.get_quiz_detail(quiz_id)
        return success_response(QuizSerializer(quiz).data)


class QuizCreateAPIView(APIView):
    """
    POST /api/lessons/{lesson_id}/quizzes/ - Tạo quiz mới trong bài học.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.create"

    def post(self, request, lesson_id):
        serializer = QuizCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quiz = QuizService.create_quiz(lesson_id, request.user, serializer.validated_data)
        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_CREATE',
            detail=f"Admin {request.user.email} đã tạo quiz '{quiz.title}' (ID: {quiz.id}) trong bài học ID {lesson_id}",
            target_id=str(quiz.id),
            target_type='Quiz',
        )

        return success_response(QuizSerializer(quiz).data, "Tạo quiz thành công.", status.HTTP_201_CREATED)


class QuizUpdateAPIView(APIView):
    """
    PATCH /api/quizzes/{quiz_id}/ - Cập nhật thông tin quiz.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.update"

    def patch(self, request, quiz_id):
        serializer = QuizCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        quiz = QuizService.update_quiz(quiz_id, request.user, serializer.validated_data)
        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_UPDATE',
            detail=f"Admin {request.user.email} đã cập nhật quiz '{quiz.title}' (ID: {quiz.id})",
            target_id=str(quiz.id),
            target_type='Quiz',
        )

        return success_response(QuizSerializer(quiz).data, "Cập nhật quiz thành công.")


class QuizDeleteAPIView(APIView):
    """
    DELETE /api/quizzes/{quiz_id}/ - Xóa quiz.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.delete"

    def delete(self, request, quiz_id):
        from apps.quizzes.repositories.quiz_repository import QuizRepository
        quiz = QuizRepository.get_by_id(quiz_id)
        quiz_title = quiz.title
        quiz_id_str = str(quiz.id)
        QuizService.delete_quiz(quiz_id, request.user)
        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_DELETE',
            detail=f"Admin {request.user.email} đã xóa quiz '{quiz_title}' (ID: {quiz_id_str})",
            target_id=quiz_id_str,
            target_type='Quiz',
        )

        return success_response(None, "Xóa quiz thành công.")


# ==================== QUESTION ====================

class QuizQuestionListAPIView(APIView):
    """
    GET /api/quizzes/{quiz_id}/questions/ - Lấy danh sách câu hỏi của một quiz.
    """
    permission_classes = [AllowAny]

    def get(self, request, quiz_id):
        questions = QuestionService.get_questions_by_quiz(quiz_id)
        return success_response(QuestionSerializer(questions, many=True).data)


class QuestionCreateAPIView(APIView):
    """
    POST /api/quizzes/{quiz_id}/questions/ - Tạo câu hỏi mới trong quiz.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.create"

    def post(self, request, quiz_id):
        serializer = QuestionCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        question = QuestionService.create_question(quiz_id, request.user, serializer.validated_data)
        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_CREATE',
            detail=f"Admin {request.user.email} đã tạo câu hỏi (ID: {question.id}) trong quiz ID {quiz_id}",
            target_id=str(question.id),
            target_type='Question',
        )

        return success_response(QuestionSerializer(question).data, "Tạo câu hỏi thành công.", status.HTTP_201_CREATED)


class QuestionUpdateAPIView(APIView):
    """
    PATCH /api/questions/{question_id}/ - Cập nhật câu hỏi.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.update"

    def patch(self, request, question_id):
        serializer = QuestionCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        question = QuestionService.update_question(question_id, request.user, serializer.validated_data)
        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_UPDATE',
            detail=f"Admin {request.user.email} đã cập nhật câu hỏi (ID: {question.id})",
            target_id=str(question.id),
            target_type='Question',
        )

        return success_response(QuestionSerializer(question).data, "Cập nhật câu hỏi thành công.")


class QuestionDeleteAPIView(APIView):
    """
    DELETE /api/questions/{question_id}/ - Xóa câu hỏi.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.delete"

    def delete(self, request, question_id):
        from apps.quizzes.repositories.question_repository import QuestionRepository
        question = QuestionRepository.get_by_id(question_id)
        question_id_str = str(question.id)
        QuestionService.delete_question(question_id, request.user)
        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_DELETE',
            detail=f"Admin {request.user.email} đã xóa câu hỏi (ID: {question_id_str})",
            target_id=question_id_str,
            target_type='Question',
        )

        return success_response(None, "Xóa câu hỏi thành công.")
