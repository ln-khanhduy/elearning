from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from apps.common.base_api_view import BasePermissionAPIView
from apps.system.services import admin_log_service

from apps.lessons.serializers.chapter_serializer import ChapterSerializer, ChapterCreateUpdateSerializer, ChapterReorderSerializer
from apps.lessons.services import chapter_service

from apps.lessons.serializers.lesson_serializer import LessonSerializer, LessonCreateUpdateSerializer, LessonReorderSerializer
from apps.lessons.services import lesson_service
from apps.lessons.repositories import lesson_repository
from apps.common.response_helpers import success_response


# ==================== CHAPTER ====================

class CourseChapterListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        chapters = chapter_service.get_chapters_by_course(course_id)
        serializer = ChapterSerializer(chapters, many=True)
        return success_response(serializer.data)


class ChapterCreateAPIView(BasePermissionAPIView):
    required_permission = "course.lesson.create"

    def post(self, request, course_id):
        serializer = ChapterCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        chapter = chapter_service.create_chapter(course_id, request.user, serializer.validated_data)
        admin_log_service.log(
            admin=request.user,
            action_type='LESSON_CREATE',
            detail=f"Admin {request.user.email} đã tạo chương học '{chapter.title}' (ID: {chapter.id}) trong khóa học ID {course_id}",
            target_id=str(chapter.id),
            target_type='Section',
        )

        return success_response(ChapterSerializer(chapter).data, "Tạo chương học thành công.", status.HTTP_201_CREATED)


class ChapterUpdateAPIView(BasePermissionAPIView):
    required_permission = "course.lesson.update"

    def patch(self, request, chapter_id):
        serializer = ChapterCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        chapter = chapter_service.update_chapter(chapter_id, request.user, serializer.validated_data)
        admin_log_service.log(
            admin=request.user,
            action_type='LESSON_UPDATE',
            detail=f"Admin {request.user.email} đã cập nhật chương học '{chapter.title}' (ID: {chapter.id})",
            target_id=str(chapter.id),
            target_type='Section',
        )

        return success_response(ChapterSerializer(chapter).data, "Cập nhật chương học thành công.")


class ChapterDeleteAPIView(BasePermissionAPIView):
    required_permission = "course.lesson.delete"

    def delete(self, request, chapter_id):
        chapter_obj = chapter_service.get_chapters_by_course(chapter_id).filter(id=chapter_id).first()
        if not chapter_obj:
            from apps.lessons.repositories import chapter_repository as ch_repo
            chapter_obj = ch_repo.get_by_id(chapter_id)
        chapter_title = chapter_obj.title
        chapter_id_str = str(chapter_obj.id)
        chapter_service.delete_chapter(chapter_id, request.user)
        admin_log_service.log(
            admin=request.user,
            action_type='LESSON_DELETE',
            detail=f"Admin {request.user.email} đã xóa chương học '{chapter_title}' (ID: {chapter_id_str})",
            target_id=chapter_id_str,
            target_type='Section',
        )

        return success_response(None, "Xóa chương học thành công.")


class ChapterReorderAPIView(BasePermissionAPIView):
    required_permission = "course.lesson.update"

    def patch(self, request, course_id):
        serializer = ChapterReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        chapters = chapter_service.reorder_chapter(course_id, request.user, serializer.validated_data["chapters"])
        admin_log_service.log(
            admin=request.user,
            action_type='LESSON_REORDER',
            detail=f"Admin {request.user.email} đã sắp xếp lại thứ tự chương học trong khóa học ID {course_id}",
            target_id=str(course_id),
            target_type='Course',
        )

        return success_response(ChapterSerializer(chapters, many=True).data, "Sắp xếp chương học thành công.")


# ==================== LESSON ====================

class ChapterLessonListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, chapter_id):
        lessons = lesson_service.get_lessons_by_chapter(chapter_id)
        return success_response(LessonSerializer(lessons, many=True).data)


class LessonDetailAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, lesson_id):
        lesson = lesson_service.get_lesson_detail(lesson_id)
        return success_response(LessonSerializer(lesson).data)


class LessonCreateAPIView(BasePermissionAPIView):
    required_permission = "course.lesson.create"

    def post(self, request, chapter_id):
        serializer = LessonCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lesson = lesson_service.create_lesson(chapter_id, request.user, serializer.validated_data)
        admin_log_service.log(
            admin=request.user,
            action_type='LESSON_CREATE',
            detail=f"Admin {request.user.email} đã tạo bài học '{lesson.title}' (ID: {lesson.id}) trong chương ID {chapter_id}",
            target_id=str(lesson.id),
            target_type='Lesson',
        )

        return success_response(LessonSerializer(lesson).data, "Tạo bài học thành công.", status.HTTP_201_CREATED)


class LessonUpdateAPIView(BasePermissionAPIView):
    required_permission = "course.lesson.update"

    def patch(self, request, lesson_id):
        serializer = LessonCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        lesson = lesson_service.update_lesson(lesson_id, request.user, serializer.validated_data)
        admin_log_service.log(
            admin=request.user,
            action_type='LESSON_UPDATE',
            detail=f"Admin {request.user.email} đã cập nhật bài học '{lesson.title}' (ID: {lesson.id})",
            target_id=str(lesson.id),
            target_type='Lesson',
        )

        return success_response(LessonSerializer(lesson).data, "Cập nhật bài học thành công.")


class LessonDeleteAPIView(BasePermissionAPIView):
    required_permission = "course.lesson.delete"

    def delete(self, request, lesson_id):
        lesson = lesson_repository.get_by_id(lesson_id)
        lesson_title = lesson.title
        lesson_id_str = str(lesson.id)
        lesson_service.delete_lesson(lesson_id, request.user)
        admin_log_service.log(
            admin=request.user,
            action_type='LESSON_DELETE',
            detail=f"Admin {request.user.email} đã xóa bài học '{lesson_title}' (ID: {lesson_id_str})",
            target_id=lesson_id_str,
            target_type='Lesson',
        )

        return success_response(None, "Xóa bài học thành công.")


class LessonReorderAPIView(BasePermissionAPIView):
    required_permission = "course.lesson.update"

    def patch(self, request, chapter_id):
        serializer = LessonReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lessons = lesson_service.reorder_lessons(chapter_id, request.user, serializer.validated_data["lessons"])
        admin_log_service.log(
            admin=request.user,
            action_type='LESSON_REORDER',
            detail=f"Admin {request.user.email} đã sắp xếp lại thứ tự bài học trong chương ID {chapter_id}",
            target_id=str(chapter_id),
            target_type='Section',
        )

        return success_response(LessonSerializer(lessons, many=True).data, "Sắp xếp bài học thành công.")