from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from apps.common.permissions import HasRequiredPermission
from apps.system.services.admin_log_service import AdminLogService

from apps.courses.services.course_service import CourseService
from apps.courses.serializers.course_serializer import CourseListSerializer, CourseDetailSerializer, CourseCreateUpdateSerializer, CourseRejectSerializer



class CourseListAPIView(APIView):
    """
    GET /api/courses/ - Lấy danh sách khóa học.
    Có thể tìm kiếm theo từ khóa (q), lọc theo trạng thái (status) hoặc danh mục (category).
    Không yêu cầu đăng nhập.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        courses = CourseService.search_courses(
            keyword=request.GET.get("q"),
            status_value=request.GET.get("status"),
            category_id=request.GET.get("category")
        )
        serializer = CourseListSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CourseDetailAPIView(APIView):
    """
    GET /api/courses/{course_id}/ - Lấy thông tin chi tiết của một khóa học.
    Không yêu cầu đăng nhập.
    """
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        course = CourseService.get_course_detail(course_id)
        return Response(CourseDetailSerializer(course).data, status=status.HTTP_200_OK)


class CourseCreateAPIView(APIView):
    """
    POST /api/courses/ - Tạo khóa học mới.
    Yêu cầu quyền: course.create
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.create"

    def post(self, request):
        serializer = CourseCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = CourseService.create_course(request.user, serializer.validated_data)
        AdminLogService.log(
            admin=request.user,
            action_type='COURSE_CREATE',
            detail=f"Admin {request.user.email} đã tạo khóa học '{course.title}' (ID: {course.id})",
            target_id=str(course.id),
            target_type='Course',
        )

        return Response({"detail": "Tạo khóa học thành công.", "course": CourseDetailSerializer(course).data}, status=status.HTTP_201_CREATED)



class CourseUpdateAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/ - Cập nhật thông tin khóa học.
    Yêu cầu quyền: course.update
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.update"

    def patch(self, request, course_id):
        serializer = CourseCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        course = CourseService.update_course(course_id, request.user, serializer.validated_data)
        AdminLogService.log(
            admin=request.user,
            action_type='COURSE_UPDATE',
            detail=f"Admin {request.user.email} đã cập nhật khóa học '{course.title}' (ID: {course.id})",
            target_id=str(course.id),
            target_type='Course',
        )

        return Response({"detail": "Cập nhật khóa học thành công.", "course": CourseDetailSerializer(course).data}, status=status.HTTP_200_OK)



class CourseDeleteAPIView(APIView):
    """
    DELETE /api/courses/{course_id}/ - Xóa khóa học.
    Yêu cầu quyền: course.delete
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.delete"

    def delete(self, request, course_id):
        from apps.courses.repositories.course_repository import CourseRepository
        course = CourseRepository.get_by_id(course_id)
        course_title = course.title
        course_id_str = str(course.id)
        CourseService.delete_course(course_id, request.user)
        AdminLogService.log(
            admin=request.user,
            action_type='COURSE_DELETE',
            detail=f"Admin {request.user.email} đã xóa khóa học '{course_title}' (ID: {course_id_str})",
            target_id=course_id_str,
            target_type='Course',
        )

        return Response({"detail": "Xóa khóa học thành công."}, status=status.HTTP_200_OK)




class CourseSubmitReviewAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/submit-review/ - Gửi khóa học chờ duyệt.
    Yêu cầu quyền: course.update
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.update"

    def patch(self, request, course_id):
        course = CourseService.submit_for_review(course_id, request.user)
        return Response({"detail": "Đã gửi khóa học chờ duyệt.", "course": CourseDetailSerializer(course).data}, status=status.HTTP_200_OK)


class PendingCourseListAPIView(APIView):
    """
    GET /api/courses/pending/ - Lấy danh sách khóa học đang chờ duyệt.
    Yêu cầu quyền: course.approve
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.approve"

    def get(self, request):
        courses = CourseService.get_pending_courses()
        serializer = CourseListSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CourseApproveAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/approve/ - Duyệt khóa học.
    Yêu cầu quyền: course.approve
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.approve"

    def patch(self, request, course_id):
        course = CourseService.approve_course(course_id, request.user)
        AdminLogService.log(
            admin=request.user,
            action_type='COURSE_APPROVE',
            detail=f"Admin {request.user.email} đã duyệt khóa học '{course.title}' (ID: {course.id})",
            target_id=str(course.id),
            target_type='Course',
        )

        return Response({"detail": "Duyệt khóa học thành công.", "course": CourseDetailSerializer(course).data}, status=status.HTTP_200_OK)



class CourseRejectAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/reject/ - Từ chối khóa học kèm lý do.
    Yêu cầu quyền: course.approve
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.approve"

    def patch(self, request, course_id):
        serializer = CourseRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = CourseService.reject_course(course_id, request.user, serializer.validated_data["approval_note"])
        AdminLogService.log(
            admin=request.user,
            action_type='COURSE_REJECT',
            detail=f"Admin {request.user.email} đã từ chối khóa học '{course.title}' (ID: {course.id}). Lý do: {serializer.validated_data['approval_note']}",
            target_id=str(course.id),
            target_type='Course',
        )

        return Response({"detail": "Từ chối khóa học thành công.", "course": CourseDetailSerializer(course).data}, status=status.HTTP_200_OK)



class CoursePublishAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/publish/ - Public khóa học sau khi đã được duyệt.
    Yêu cầu quyền: course.update
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.update"

    def patch(self, request, course_id):
        course = CourseService.publish_course(course_id, request.user)
        AdminLogService.log(
            admin=request.user,
            action_type='COURSE_PUBLISH',
            detail=f"Admin {request.user.email} đã xuất bản khóa học '{course.title}' (ID: {course.id})",
            target_id=str(course.id),
            target_type='Course',
        )

        return Response({"detail": "Public khóa học thành công.", "course": CourseDetailSerializer(course).data}, status=status.HTTP_200_OK)


