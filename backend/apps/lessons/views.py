from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from apps.common.permissions import HasRequiredPermission
from apps.system.services.admin_log_service import AdminLogService

from apps.lessons.serializers.section_serializer import SectionSerializer, SectionCreateUpdateSerializer, SectionReorderSerializer
from apps.lessons.services.section_service import SectionService

from apps.lessons.serializers.lesson_serializer import LessonSerializer, LessonCreateUpdateSerializer, LessonReorderSerializer
from apps.lessons.services.lesson_service import LessonService



class CourseSectionListAPIView(APIView):
    """
    GET /api/courses/{course_id}/sections/ - Lấy danh sách chương học của một khóa học.
    Không yêu cầu đăng nhập.
    """
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        sections = SectionService.get_sections_by_course(course_id)
        serializer = SectionSerializer(sections, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SectionCreateAPIView(APIView):
    """
    POST /api/courses/{course_id}/sections/ - Tạo chương học mới trong khóa học.
    Yêu cầu quyền: course.lesson.create
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.create"

    def post(self, request, course_id):
        serializer = SectionCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        section = SectionService.create_section(course_id, request.user, serializer.validated_data)
        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_CREATE',
            detail=f"Admin {request.user.email} đã tạo chương học '{section.title}' (ID: {section.id}) trong khóa học ID {course_id}",
            target_id=str(section.id),
            target_type='Section',
        )

        return Response({"detail": "Tạo chương học thành công.", "section": SectionSerializer(section).data}, status=status.HTTP_201_CREATED)



class SectionUpdateAPIView(APIView):
    """
    PATCH /api/sections/{section_id}/ - Cập nhật thông tin chương học.
    Yêu cầu quyền: course.lesson.update
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.update"

    def patch(self, request, section_id):
        serializer = SectionCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        section = SectionService.update_section(section_id, request.user, serializer.validated_data)
        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_UPDATE',
            detail=f"Admin {request.user.email} đã cập nhật chương học '{section.title}' (ID: {section.id})",
            target_id=str(section.id),
            target_type='Section',
        )

        return Response({"detail": "Cập nhật chương học thành công.", "section": SectionSerializer(section).data}, status=status.HTTP_200_OK)



class SectionDeleteAPIView(APIView):
    """
    DELETE /api/sections/{section_id}/ - Xóa chương học.
    Yêu cầu quyền: course.lesson.delete
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.delete"

    def delete(self, request, section_id):
        from apps.lessons.repositories.section_repository import SectionRepository
        section = SectionRepository.get_by_id(section_id)
        section_title = section.title
        section_id_str = str(section.id)
        SectionService.delete_section(section_id, request.user)
        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_DELETE',
            detail=f"Admin {request.user.email} đã xóa chương học '{section_title}' (ID: {section_id_str})",
            target_id=section_id_str,
            target_type='Section',
        )

        return Response({"detail": "Xóa chương học thành công."}, status=status.HTTP_200_OK)



class SectionReorderAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/sections/reorder/ - Sắp xếp lại thứ tự các chương học.
    Yêu cầu quyền: course.lesson.update
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.update"

    def patch(self, request, course_id):
        serializer = SectionReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sections = SectionService.reorder_sections(course_id, request.user, serializer.validated_data["sections"])
        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_REORDER',
            detail=f"Admin {request.user.email} đã sắp xếp lại thứ tự chương học trong khóa học ID {course_id}",
            target_id=str(course_id),
            target_type='Course',
        )

        return Response({"detail": "Sắp xếp chương học thành công.", "sections": SectionSerializer(sections, many=True).data}, status=status.HTTP_200_OK)



class SectionLessonListAPIView(APIView):
    """
    GET /api/sections/{section_id}/lessons/ - Lấy danh sách bài học trong một chương.
    Không yêu cầu đăng nhập.
    """
    permission_classes = [AllowAny]

    def get(self, request, section_id):
        lessons = LessonService.get_lessons_by_section(section_id)
        return Response(LessonSerializer(lessons, many=True).data, status=status.HTTP_200_OK)


class LessonDetailAPIView(APIView):
    """
    GET /api/lessons/{lesson_id}/ - Lấy thông tin chi tiết của một bài học.
    Không yêu cầu đăng nhập.
    """
    permission_classes = [AllowAny]

    def get(self, request, lesson_id):
        lesson = LessonService.get_lesson_detail(lesson_id)
        return Response(LessonSerializer(lesson).data, status=status.HTTP_200_OK)


class LessonCreateAPIView(APIView):
    """
    POST /api/sections/{section_id}/lessons/ - Tạo bài học mới trong chương.
    Yêu cầu quyền: course.lesson.create
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.create"

    def post(self, request, section_id):
        serializer = LessonCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lesson = LessonService.create_lesson(section_id, request.user, serializer.validated_data)
        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_CREATE',
            detail=f"Admin {request.user.email} đã tạo bài học '{lesson.title}' (ID: {lesson.id}) trong chương ID {section_id}",
            target_id=str(lesson.id),
            target_type='Lesson',
        )

        return Response({"detail": "Tạo bài học thành công.", "lesson": LessonSerializer(lesson).data}, status=status.HTTP_201_CREATED)



class LessonUpdateAPIView(APIView):
    """
    PATCH /api/lessons/{lesson_id}/ - Cập nhật thông tin bài học.
    Yêu cầu quyền: course.lesson.update
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

        return Response({"detail": "Cập nhật bài học thành công.", "lesson": LessonSerializer(lesson).data}, status=status.HTTP_200_OK)



class LessonDeleteAPIView(APIView):
    """
    DELETE /api/lessons/{lesson_id}/ - Xóa bài học.
    Yêu cầu quyền: course.lesson.delete
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.delete"

    def delete(self, request, lesson_id):
        from apps.lessons.repositories.lesson_repository import LessonRepository
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

        return Response({"detail": "Xóa bài học thành công."}, status=status.HTTP_200_OK)



class LessonReorderAPIView(APIView):
    """
    PATCH /api/sections/{section_id}/lessons/reorder/ - Sắp xếp lại thứ tự các bài học trong chương.
    Yêu cầu quyền: course.lesson.update
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.lesson.update"

    def patch(self, request, section_id):
        serializer = LessonReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lessons = LessonService.reorder_lessons(section_id, request.user, serializer.validated_data["lessons"])
        AdminLogService.log(
            admin=request.user,
            action_type='LESSON_REORDER',
            detail=f"Admin {request.user.email} đã sắp xếp lại thứ tự bài học trong chương ID {section_id}",
            target_id=str(section_id),
            target_type='Section',
        )

        return Response({"detail": "Sắp xếp bài học thành công.", "lessons": LessonSerializer(lessons, many=True).data}, status=status.HTTP_200_OK)
