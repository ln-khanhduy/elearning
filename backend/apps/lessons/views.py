from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from apps.common.permissions import HasRequiredPermission
from apps.system.services.admin_log_service import AdminLogService

from apps.lessons.serializers.chapter_serializer import ChapterSerializer, ChapterCreateUpdateSerializer, ChapterReorderSerializer
from apps.lessons.services.chapter_service import ChapterService

from apps.lessons.serializers.lesson_serializer import LessonSerializer, LessonCreateUpdateSerializer, LessonReorderSerializer
from apps.lessons.services.lesson_service import LessonService
from apps.lessons.repositories.lesson_repository import LessonRepository



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


# ==================== CHAPTER ====================

class CourseChapterListAPIView(APIView):
    """
    GET /api/courses/{course_id}/chapters/ - Lấy danh sách chương học của một khóa học.
    """
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        chapters = ChapterService.get_chapters_by_course(course_id)
        serializer = ChapterSerializer(chapters, many=True)
        return success_response(serializer.data)


class ChapterCreateAPIView(APIView):
    """
    POST /api/courses/{course_id}/chapters/ - Tạo chương học mới trong khóa học.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.create"

    def post(self, request, course_id):
        serializer = ChapterCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        chapter = ChapterService.create_chapter(course_id, request.user, serializer.validated_data)
        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_CREATE',
            detail=f"Admin {request.user.email} đã tạo chương học '{chapter.title}' (ID: {chapter.id}) trong khóa học ID {course_id}",
            target_id=str(chapter.id),
            target_type='Section',
        )

        return success_response(ChapterSerializer(chapter).data, "Tạo chương học thành công.", status.HTTP_201_CREATED)


class ChapterUpdateAPIView(APIView):
    """
    PATCH /api/chapters/{chapter_id}/ - Cập nhật thông tin chương học.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.update"

    def patch(self, request, chapter_id):
        serializer = ChapterCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        chapter = ChapterService.update_chapter(chapter_id, request.user, serializer.validated_data)
        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_UPDATE',
            detail=f"Admin {request.user.email} đã cập nhật chương học '{chapter.title}' (ID: {chapter.id})",
            target_id=str(chapter.id),
            target_type='Section',
        )

        return success_response(ChapterSerializer(chapter).data, "Cập nhật chương học thành công.")


class ChapterDeleteAPIView(APIView):
    """
    DELETE /api/chapters/{chapter_id}/ - Xóa chương học.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.delete"

    def delete(self, request, chapter_id):
        from apps.lessons.repositories.chapter_repository import ChapterRepository
        chapter_obj = ChapterRepository.get_by_id(chapter_id)
        chapter_title = chapter_obj.title
        chapter_id_str = str(chapter_obj.id)
        ChapterService.delete_chapter(chapter_id, request.user)
        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_DELETE',
            detail=f"Admin {request.user.email} đã xóa chương học '{chapter_title}' (ID: {chapter_id_str})",
            target_id=chapter_id_str,
            target_type='Section',
        )

        return success_response(None, "Xóa chương học thành công.")


class ChapterReorderAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/chapters/reorder/ - Sắp xếp lại thứ tự các chương học.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.update"

    def patch(self, request, course_id):
        serializer = ChapterReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        chapters = ChapterService.reorder_chapter(course_id, request.user, serializer.validated_data["chapters"])
        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_REORDER',
            detail=f"Admin {request.user.email} đã sắp xếp lại thứ tự chương học trong khóa học ID {course_id}",
            target_id=str(course_id),
            target_type='Course',
        )

        return success_response(ChapterSerializer(chapters, many=True).data, "Sắp xếp chương học thành công.")


# ==================== LESSON ====================

class ChapterLessonListAPIView(APIView):
    """
    GET /api/chapters/{chapter_id}/lessons/ - Lấy danh sách bài học trong một chương.
    """
    permission_classes = [AllowAny]

    def get(self, request, chapter_id):
        lessons = LessonService.get_lessons_by_chapter(chapter_id)
        return success_response(LessonSerializer(lessons, many=True).data)


class LessonDetailAPIView(APIView):
    """
    GET /api/lessons/{lesson_id}/ - Lấy thông tin chi tiết của một bài học.
    """
    permission_classes = [AllowAny]

    def get(self, request, lesson_id):
        lesson = LessonService.get_lesson_detail(lesson_id)
        return success_response(LessonSerializer(lesson).data)


class LessonCreateAPIView(APIView):
    """
    POST /api/chapters/{chapter_id}/lessons/ - Tạo bài học mới trong chương.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.create"

    def post(self, request, chapter_id):
        serializer = LessonCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lesson = LessonService.create_lesson(chapter_id, request.user, serializer.validated_data)
        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_CREATE',
            detail=f"Admin {request.user.email} đã tạo bài học '{lesson.title}' (ID: {lesson.id}) trong chương ID {chapter_id}",
            target_id=str(lesson.id),
            target_type='Lesson',
        )

        return success_response(LessonSerializer(lesson).data, "Tạo bài học thành công.", status.HTTP_201_CREATED)


class LessonUpdateAPIView(APIView):
    """
    PATCH /api/lessons/{lesson_id}/ - Cập nhật thông tin bài học.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.update"

    def patch(self, request, lesson_id):
        serializer = LessonCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        lesson = LessonService.update_lesson(lesson_id, request.user, serializer.validated_data)
        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_UPDATE',
            detail=f"Admin {request.user.email} đã cập nhật bài học '{lesson.title}' (ID: {lesson.id})",
            target_id=str(lesson.id),
            target_type='Lesson',
        )

        return success_response(LessonSerializer(lesson).data, "Cập nhật bài học thành công.")


class LessonDeleteAPIView(APIView):
    """
    DELETE /api/lessons/{lesson_id}/ - Xóa bài học.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.delete"

    def delete(self, request, lesson_id):
        lesson = LessonRepository.get_by_id(lesson_id)
        lesson_title = lesson.title
        lesson_id_str = str(lesson.id)
        LessonService.delete_lesson(lesson_id, request.user)
        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_DELETE',
            detail=f"Admin {request.user.email} đã xóa bài học '{lesson_title}' (ID: {lesson_id_str})",
            target_id=lesson_id_str,
            target_type='Lesson',
        )

        return success_response(None, "Xóa bài học thành công.")


class LessonReorderAPIView(APIView):
    """
    PATCH /api/chapters/{chapter_id}/lessons/reorder/ - Sắp xếp lại thứ tự các bài học trong chương.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.update"

    def patch(self, request, chapter_id):
        serializer = LessonReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lessons = LessonService.reorder_lessons(chapter_id, request.user, serializer.validated_data["lessons"])
        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_REORDER',
            detail=f"Admin {request.user.email} đã sắp xếp lại thứ tự bài học trong chương ID {chapter_id}",
            target_id=str(chapter_id),
            target_type='Section',
        )

        return success_response(LessonSerializer(lessons, many=True).data, "Sắp xếp bài học thành công.")
