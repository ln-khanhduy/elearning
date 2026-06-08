from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from apps.common.permissions import HasRequiredPermission
from apps.lessons.repositories.section_repository import SectionRepository
from apps.lessons.serializers.section_serializer import SectionSerializer, SectionCreateUpdateSerializer, SectionReorderSerializer
from apps.lessons.services.section_service import SectionService

from apps.lessons.repositories.lesson_repository import LessonRepository
from apps.lessons.serializers.lesson_serializer import LessonSerializer, LessonCreateUpdateSerializer, LessonReorderSerializer
from apps.lessons.services.lesson_service import LessonService

class CourseSectionListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        serializer = SectionSerializer(SectionRepository.get_by_course(course_id), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class SectionCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "lesson.create"

    def post(self, request, course_id):
        serializer = SectionCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        section = SectionService.create_section(course_id, request.user, serializer.validated_data)
        return Response({"detail": "Tạo chương học thành công.", "section": SectionSerializer(section).data}, status=status.HTTP_201_CREATED)

class SectionUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "lesson.update"

    def patch(self, request, section_id):
        serializer = SectionCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        section = SectionService.update_section(section_id, request.user, serializer.validated_data)
        return Response({"detail": "Cập nhật chương học thành công.", "section": SectionSerializer(section).data}, status=status.HTTP_200_OK)

class SectionDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "lesson.delete"

    def delete(self, request, section_id):
        SectionService.delete_section(section_id, request.user)
        return Response({"detail": "Xóa chương học thành công."}, status=status.HTTP_200_OK)

class SectionReorderAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "lesson.update"

    def patch(self, request, course_id):
        serializer = SectionReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sections = SectionService.reorder_sections(course_id, request.user, serializer.validated_data["sections"])
        return Response({"detail": "Sắp xếp chương học thành công.", "sections": SectionSerializer(sections, many=True).data}, status=status.HTTP_200_OK)
    
class SectionLessonListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, section_id):
        lessons = LessonRepository.get_by_section(section_id)
        return Response(LessonSerializer(lessons, many=True).data, status=status.HTTP_200_OK)


class LessonDetailAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, lesson_id):
        lesson = LessonRepository.get_by_id(lesson_id)
        return Response(LessonSerializer(lesson).data, status=status.HTTP_200_OK)


class LessonCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "lesson.create"

    def post(self, request, section_id):
        serializer = LessonCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lesson = LessonService.create_lesson(section_id, request.user, serializer.validated_data)
        return Response({"detail": "Tạo bài học thành công.", "lesson": LessonSerializer(lesson).data}, status=status.HTTP_201_CREATED)


class LessonUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "lesson.update"

    def patch(self, request, lesson_id):
        serializer = LessonCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        lesson = LessonService.update_lesson(lesson_id, request.user, serializer.validated_data)
        return Response({"detail": "Cập nhật bài học thành công.", "lesson": LessonSerializer(lesson).data}, status=status.HTTP_200_OK)


class LessonDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "lesson.delete"

    def delete(self, request, lesson_id):
        LessonService.delete_lesson(lesson_id, request.user)
        return Response({"detail": "Xóa bài học thành công."}, status=status.HTTP_200_OK)


class LessonReorderAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "lesson.update"

    def patch(self, request, section_id):
        serializer = LessonReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lessons = LessonService.reorder_lessons(section_id, request.user, serializer.validated_data["lessons"])
        return Response({"detail": "Sắp xếp bài học thành công.", "lessons": LessonSerializer(lessons, many=True).data}, status=status.HTTP_200_OK)