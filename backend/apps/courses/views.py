from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from apps.common.permissions import HasRequiredPermission
from apps.courses.repositories.course_repository import CourseRepository
from apps.courses.services.course_service import CourseService
from apps.courses.serializers.course_serializer import CourseListSerializer, CourseDetailSerializer, CourseCreateUpdateSerializer, CourseRejectSerializer


class CourseListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        courses = CourseRepository.search(request.GET.get("q"), request.GET.get("status"), request.GET.get("category"))
        serializer = CourseListSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CourseDetailAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        course = CourseRepository.get_by_id(course_id)
        return Response(CourseDetailSerializer(course).data, status=status.HTTP_200_OK)


class CourseCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.create"

    def post(self, request):
        serializer = CourseCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = CourseService.create_course(request.user, serializer.validated_data)
        return Response({"detail": "Tạo khóa học thành công.", "course": CourseDetailSerializer(course).data}, status=status.HTTP_201_CREATED)


class CourseUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.update"

    def patch(self, request, course_id):
        serializer = CourseCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        course = CourseService.update_course(course_id, request.user, serializer.validated_data)
        return Response({"detail": "Cập nhật khóa học thành công.", "course": CourseDetailSerializer(course).data}, status=status.HTTP_200_OK)


class CourseDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.delete"

    def delete(self, request, course_id):
        CourseService.delete_course(course_id, request.user)
        return Response({"detail": "Xóa khóa học thành công."}, status=status.HTTP_200_OK)


class CourseSubmitReviewAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.update"

    def patch(self, request, course_id):
        course = CourseService.submit_for_review(course_id, request.user)
        return Response({"detail": "Đã gửi khóa học chờ duyệt.", "course": CourseDetailSerializer(course).data}, status=status.HTTP_200_OK)
    
class PendingCourseListAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.approve"

    def get(self, request):
        serializer = CourseListSerializer(CourseRepository.get_pending_courses(), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class CourseApproveAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.approve"

    def patch(self, request, course_id):
        course = CourseService.approve_course(course_id, request.user)
        return Response({"detail": "Duyệt khóa học thành công.", "course": CourseDetailSerializer(course).data}, status=status.HTTP_200_OK)

class CourseRejectAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.approve"

    def patch(self, request, course_id):
        serializer = CourseRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = CourseService.reject_course(course_id, request.user, serializer.validated_data["approval_note"])
        return Response({"detail": "Từ chối khóa học thành công.", "course": CourseDetailSerializer(course).data}, status=status.HTTP_200_OK)


class CoursePublishAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.update"

    def patch(self, request, course_id):
        course = CourseService.publish_course(course_id, request.user)
        return Response({"detail": "Public khóa học thành công.", "course": CourseDetailSerializer(course).data}, status=status.HTTP_200_OK)