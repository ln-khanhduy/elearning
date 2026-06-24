import os
from django.conf import settings
from django.http import HttpResponse
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser



from apps.common.base_api_view import BasePermissionAPIView
from apps.system.services.admin_log_service import AdminLogService

from apps.quizzes.services.quiz_service import QuizService
from apps.quizzes.serializers.quiz_serializer import QuizSerializer, QuizCreateUpdateSerializer

from apps.quizzes.services.question_service import QuestionService
from apps.quizzes.serializers.question_serializer import QuestionSerializer, QuestionCreateUpdateSerializer

from apps.quizzes.services.question_import_service import QuestionImportService
from apps.quizzes.repositories.quiz_repository import QuizRepository
from apps.courses.services.course_permission_service import CoursePermissionService
import re
import base64




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


class QuizCreateAPIView(BasePermissionAPIView):
    """
    POST /api/lessons/{lesson_id}/quizzes/create/ - Tạo quiz mới trong bài học.
    """
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


class QuizUpdateAPIView(BasePermissionAPIView):
    """
    PATCH /api/quizzes/{quiz_id}/ - Cập nhật thông tin quiz.
    """
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


class QuizDeleteAPIView(BasePermissionAPIView):
    """
    DELETE /api/quizzes/{quiz_id}/ - Xóa quiz.
    """
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


class QuestionCreateAPIView(BasePermissionAPIView):
    """
    POST /api/quizzes/{quiz_id}/questions/ - Tạo câu hỏi mới trong quiz.
    """
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


class QuestionUpdateAPIView(BasePermissionAPIView):
    """
    PATCH /api/questions/{question_id}/ - Cập nhật câu hỏi.
    """
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


class QuestionDeleteAPIView(BasePermissionAPIView):
    """
    DELETE /api/questions/{question_id}/ - Xóa câu hỏi.
    """
    required_permission = "course.lesson.delete"

    def delete(self, request, question_id):
        from apps.quizzes.repositories.question_repository import QuestionRepository
        question = QuestionRepository.get_by_id(question_id)
        if not question:
            return error_response("Câu hỏi không tồn tại.", http_status=status.HTTP_404_NOT_FOUND)
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


# ==================== QUESTION IMPORT ====================

class QuestionImportPreviewAPIView(BasePermissionAPIView):
    """
    POST /api/quizzes/{quiz_id}/questions/import/preview/
    Upload file CSV/XLSX để preview dữ liệu trước khi import.
    """
    required_permission = "course.lesson.create"
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, quiz_id):
        file = request.FILES.get("file")
        if not file:
            return error_response("Vui lòng upload file CSV hoặc XLSX.", http_status=status.HTTP_400_BAD_REQUEST)

        try:
            ext = QuestionImportService.validate_file(file)
        except ValueError as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)

        try:
            if ext == '.csv':
                rows = QuestionImportService.parse_csv(file)
            else:
                rows = QuestionImportService.parse_excel(file)
        except ValueError as e:
            # Check if this is a missing columns error
            error_msg = str(e)
            if "Thiếu cột bắt buộc" in error_msg:
                # Extract column names from the error message
                match = re.search(r'Thiếu cột bắt buộc: (.+)', error_msg)
                missing_columns = match.group(1).split(', ') if match else []
                return success_response({
                    "missing_columns": missing_columns,
                }, error_msg, http_status=status.HTTP_400_BAD_REQUEST)
            return error_response(error_msg, http_status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return error_response(f"Lỗi đọc file: {str(e)}", http_status=status.HTTP_400_BAD_REQUEST)


        if not rows:
            return error_response("File không có dữ liệu.", http_status=status.HTTP_400_BAD_REQUEST)

        preview_data, errors = QuestionImportService.preview_questions(rows)

        return success_response({
            "total_rows": len(rows),
            "valid_rows": len(preview_data),
            "error_count": len(errors),
            "preview": preview_data,
            "errors": errors,
        }, "Preview dữ liệu thành công.")


class QuestionImportExecuteAPIView(BasePermissionAPIView):
    """
    POST /api/quizzes/{quiz_id}/questions/import/execute/
    Import câu hỏi từ dữ liệu đã preview.
    Body: { "rows": [...] }
    """
    required_permission = "course.lesson.create"

    def post(self, request, quiz_id):
        rows = request.data.get("rows")
        if not rows or not isinstance(rows, list):
            return error_response("Dữ liệu không hợp lệ.", http_status=status.HTTP_400_BAD_REQUEST)

        if not rows:
            return error_response("Không có câu hỏi nào để import.", http_status=status.HTTP_400_BAD_REQUEST)

        quiz = QuizRepository.get_by_id(quiz_id)
        if not quiz:
            return error_response("Quiz không tồn tại.", http_status=status.HTTP_404_NOT_FOUND)

        if not CoursePermissionService.can_manage_course(quiz.lesson.chapter.course, request.user):
            return error_response("Bạn không có quyền thao tác với khóa học này.", http_status=status.HTTP_403_FORBIDDEN)

        imported_count, errors = QuestionImportService.import_questions(rows, quiz)

        if errors:
            return success_response({
                "imported_count": imported_count,
                "errors": errors,
            }, f"Import {imported_count} câu hỏi, có {len(errors)} lỗi.")

        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_CREATE',
            detail=f"Admin {request.user.email} đã import {imported_count} câu hỏi vào quiz '{quiz.title}' (ID: {quiz.id})",
            target_id=str(quiz.id),
            target_type='Quiz',
        )

        return success_response({
            "imported_count": imported_count,
        }, f"Import thành công {imported_count} câu hỏi.", status.HTTP_201_CREATED)


class QuestionImportTemplateAPIView(APIView):
    """
    GET /api/quizzes/questions/import/template/?file_format=csv
    GET /api/quizzes/questions/import/template/?file_format=xlsx
    Tải file template mẫu.
    """
    permission_classes = [AllowAny]

    def initial(self, request, *args, **kwargs):
        self.format_kwarg = ''
        super().initial(request, *args, **kwargs)

    def get(self, request):
        fmt = request.GET.get('format') or request.GET.get('file_format') or 'csv'
        fmt = fmt.lower()

        template_dir = os.path.join(settings.BASE_DIR, 'apps', 'quizzes', 'static', 'quizzes', 'templates')

        if fmt == 'xlsx':
            file_path = os.path.join(template_dir, 'question_import_template.xlsx')
            content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            filename = 'question_import_template.xlsx'
        else:
            file_path = os.path.join(template_dir, 'question_import_template.csv')
            content_type = 'text/csv'
            filename = 'question_import_template.csv'

        with open(file_path, 'rb') as f:
            content = f.read()

        response = HttpResponse(content, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        # Add UTF-8 charset to help Excel recognize the encoding
        if fmt == 'csv':
            response['Content-Type'] = 'text/csv; charset=utf-8'
        return response
