from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from apps.enrollments.services.enrollment_service import EnrollmentService
from apps.enrollments.serializers.enrollment_serializer import EnrollmentSerializer


class MyCourseListAPIView(APIView):
    """
    GET /api/enrollments/my-courses/ - Lấy danh sách khóa học đã đăng ký của user hiện tại.
    Yêu cầu đăng nhập.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        enrollments = EnrollmentService.get_my_courses(request.user)
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EnrollmentDetailAPIView(APIView):
    """
    GET /api/enrollments/{enrollment_id}/ - Lấy chi tiết một đăng ký khóa học.
    Yêu cầu đăng nhập.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, enrollment_id):
        enrollment = EnrollmentService.get_enrollment_detail(enrollment_id)
        if enrollment.student_id != request.user.id:
            return Response({"detail": "Bạn không có quyền xem đăng ký này."}, status=status.HTTP_403_FORBIDDEN)
        return Response(EnrollmentSerializer(enrollment).data, status=status.HTTP_200_OK)


class CheckEnrolledAPIView(APIView):
    """
    GET /api/enrollments/check/{course_id}/ - Kiểm tra user đã đăng ký khóa học chưa.
    Yêu cầu đăng nhập.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        enrollment = EnrollmentService.check_enrolled(request.user, course_id)
        return Response({
            "is_enrolled": enrollment is not None,
            "enrollment": EnrollmentSerializer(enrollment).data if enrollment else None,
        }, status=status.HTTP_200_OK)
