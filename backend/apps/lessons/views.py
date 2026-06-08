from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from apps.common.permissions import HasRequiredPermission
from apps.lessons.repositories.section_repository import SectionRepository
from apps.lessons.serializers.section_serializer import SectionSerializer, SectionCreateUpdateSerializer, SectionReorderSerializer
from apps.lessons.services.section_service import SectionService

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