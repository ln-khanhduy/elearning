from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.common.base_api_view import BasePermissionAPIView
from apps.system.services.admin_log_service import AdminLogService

from apps.courses.services.course_service import CourseService
from apps.courses.services.course_assignment_service import CourseAssignmentService
from apps.courses.services.course_permission_service import CoursePermissionService
from apps.courses.services.curriculum_service import CurriculumService
from apps.courses.services.instructor_course_service import InstructorCourseService
from apps.courses.serializers.course_serializer import (
    CourseListSerializer, CourseDetailSerializer,
    CourseCreateUpdateSerializer, CourseAssignInstructorSerializer,
)
from apps.courses.serializers.category_tag_serializer import CategorySerializer
from apps.courses.models import Category


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


# ==================== PUBLIC COURSE API ====================


class CourseListAPIView(APIView):
    """
    GET /api/courses/ - Lấy danh sách khóa học public.
    Hỗ trợ: search (q), filter status, category, instructor, pagination (page, page_size).
    """
    permission_classes = [AllowAny]

    def get(self, request):
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 10))

        courses = CourseService.search_courses(
            keyword=request.GET.get("q"),
            status_value=request.GET.get("status"),
            category_id=request.GET.get("category"),
            instructor_id=request.GET.get("instructor"),
        )

        total = courses.count()
        start = (page - 1) * page_size
        end = start + page_size
        page_courses = courses[start:end]

        serializer = CourseListSerializer(page_courses, many=True)
        return success_response({
            "items": serializer.data,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
        })


class CourseDetailAPIView(APIView):
    """
    GET /api/courses/{course_id}/ - Lấy thông tin chi tiết của một khóa học.
    """
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        course = CourseService.get_course_detail(course_id)
        return success_response(CourseDetailSerializer(course).data)


# ==================== ADMIN COURSE API ====================


class AdminCourseListAPIView(BasePermissionAPIView):
    """
    GET /api/admin/courses/ - Lấy danh sách khóa học (admin).
    """
    required_permission = "course.course.view"

    def get(self, request):
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 10))

        courses = CourseService.search_courses(
            keyword=request.GET.get("q"),
            status_value=request.GET.get("status"),
            category_id=request.GET.get("category"),
            instructor_id=request.GET.get("instructor"),
        )

        total = courses.count()
        start = (page - 1) * page_size
        end = start + page_size
        page_courses = courses[start:end]

        serializer = CourseListSerializer(page_courses, many=True)
        return success_response({
            "items": serializer.data,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
        })


class AdminCourseCreateAPIView(BasePermissionAPIView):
    """
    POST /api/admin/courses/ - Tạo khóa học mới.
    """
    required_permission = "course.course.create"

    def post(self, request):
        serializer = CourseCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        course = CourseService.create_course(request.user, serializer.validated_data)

        AdminLogService.log(
            admin=request.user,
            action_type='COURSE_CREATE',
            detail=f"{request.user.email} đã tạo khóa học '{course.title}' (ID: {course.id})",
            target_id=str(course.id),
            target_type='Course',
        )

        return success_response(
            CourseDetailSerializer(course).data,
            "Tạo khóa học thành công.",
            status.HTTP_201_CREATED
        )


class AdminCourseDetailAPIView(BasePermissionAPIView):
    """
    GET /api/admin/courses/{id}/ - Lấy chi tiết khóa học (admin).
    """
    required_permission = "course.course.view"

    def get(self, request, course_id):
        course = CourseService.get_course_detail(course_id)
        return success_response(CourseDetailSerializer(course).data)


class AdminCourseUpdateAPIView(BasePermissionAPIView):
    """
    PATCH /api/admin/courses/{id}/ - Cập nhật thông tin khóa học.
    """
    required_permission = "course.course.update"

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

        return success_response(
            CourseDetailSerializer(course).data,
            "Cập nhật khóa học thành công.",
        )


class AdminCourseDeleteAPIView(BasePermissionAPIView):
    """
    DELETE /api/admin/courses/{id}/ - Xóa khóa học.
    """
    required_permission = "course.course.delete"

    def delete(self, request, course_id):
        course = CourseService.get_course_detail(course_id)
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

        return success_response(None, "Xóa khóa học thành công.")


class AdminCoursePublishAPIView(BasePermissionAPIView):
    """
    PATCH /api/admin/courses/{id}/publish/ - Public khóa học.
    """
    required_permission = "course.course.publish"

    def patch(self, request, course_id):
        course = CourseService.publish_course(course_id, request.user)
        AdminLogService.log(
            admin=request.user,
            action_type='COURSE_PUBLISH',
            detail=f"Admin {request.user.email} đã xuất bản khóa học '{course.title}' (ID: {course.id})",
            target_id=str(course.id),
            target_type='Course',
        )

        return success_response(CourseDetailSerializer(course).data, "Public khóa học thành công.")


class AdminCourseHideAPIView(BasePermissionAPIView):
    """
    PATCH /api/admin/courses/{id}/hide/ - Ẩn khóa học.
    """
    required_permission = "course.course.publish"

    def patch(self, request, course_id):
        course = CourseService.hide_course(course_id, request.user)
        AdminLogService.log(
            admin=request.user,
            action_type='COURSE_HIDE',
            detail=f"Admin {request.user.email} đã ẩn khóa học '{course.title}' (ID: {course.id})",
            target_id=str(course.id),
            target_type='Course',
        )

        return success_response(CourseDetailSerializer(course).data, "Ẩn khóa học thành công.")


class AdminCourseAssignInstructorAPIView(BasePermissionAPIView):
    """
    PATCH /api/admin/courses/{id}/assign-instructor/ - Phân công hoặc gỡ giảng viên.
    Body: { "instructor_id": 12 } (gửi null để gỡ)
    """
    required_permission = "course.instructor.assign"

    def patch(self, request, course_id):
        serializer = CourseAssignInstructorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        instructor_id = serializer.validated_data.get("instructor_id")

        if instructor_id is None:
            course = CourseAssignmentService.remove_instructor(course_id, request.user)
            AdminLogService.log(
                admin=request.user,
                action_type='COURSE_REMOVE_INSTRUCTOR',
                detail=f"Admin {request.user.email} đã gỡ giảng viên khỏi khóa học '{course.title}' (ID: {course.id})",
                target_id=str(course.id),
                target_type='Course',
            )
            return success_response(CourseDetailSerializer(course).data, "Đã gỡ giảng viên khỏi khóa học.")
        else:
            course = CourseAssignmentService.assign_instructor(course_id, instructor_id, request.user)
            instructor_name = course.assigned_instructor.get_full_name() if course.assigned_instructor else "N/A"
            AdminLogService.log(
                admin=request.user,
                action_type='COURSE_ASSIGN_INSTRUCTOR',
                detail=f"Admin {request.user.email} đã phân công giảng viên '{instructor_name}' (ID: {course.assigned_instructor_id}) cho khóa học '{course.title}' (ID: {course.id})",
                target_id=str(course.id),
                target_type='Course',
            )
            return success_response(CourseDetailSerializer(course).data, "Phân công giảng viên thành công.")


class AdminCourseAssignedInstructorAPIView(BasePermissionAPIView):
    """
    GET /api/admin/courses/{id}/assigned-instructor/ - Lấy thông tin giảng viên được phân công.
    """
    required_permission = "course.course.view"

    def get(self, request, course_id):
        course = CourseService.get_course_detail(course_id)
        data = {
            "assigned_instructor_id": course.assigned_instructor_id,
            "assigned_instructor_name": course.assigned_instructor.get_full_name() if course.assigned_instructor else None,
            "assigned_instructor_avatar": course.assigned_instructor.avatar_url if course.assigned_instructor and hasattr(course.assigned_instructor, 'avatar_url') else None,
        }
        return success_response(data)


# ==================== INSTRUCTOR COURSE API ====================


class InstructorCourseListAPIView(APIView):
    """
    GET /api/instructor/courses/ - Lấy danh sách khóa học được phân công.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        courses = CourseAssignmentService.get_assigned_courses(request.user)
        serializer = CourseListSerializer(courses, many=True)
        return success_response(serializer.data)


class InstructorCourseDetailAPIView(APIView):
    """
    GET /api/instructor/courses/{id}/ - Lấy chi tiết khóa học được phân công.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = CourseService.get_course_detail(course_id)
        if not CoursePermissionService.can_view_course(course, request.user):
            return error_response("Bạn không có quyền xem khóa học này.", http_status=status.HTTP_403_FORBIDDEN)
        return success_response(CourseDetailSerializer(course).data)


class InstructorCourseStudentsAPIView(APIView):
    """
    GET /api/instructor/courses/{id}/students/ - Lấy danh sách học viên.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        from apps.enrollments.models import Enrollment

        course = CourseService.get_course_detail(course_id)
        if not CoursePermissionService.can_view_course(course, request.user):
            return error_response("Bạn không có quyền xem khóa học này.", http_status=status.HTTP_403_FORBIDDEN)

        enrollments = Enrollment.objects.filter(
            course_id=course_id,
            status=Enrollment.Status.ACTIVE
        ).select_related('student')

        students_data = []
        for enrollment in enrollments:
            progress_obj = getattr(enrollment, 'progress', None)
            progress_value = float(progress_obj.progress_percent) if progress_obj else 0
            students_data.append({
                "id": enrollment.student.id,
                "name": enrollment.student.get_full_name(),
                "email": enrollment.student.email,
                "avatar": enrollment.student.avatar_url if hasattr(enrollment.student, 'avatar_url') else None,
                "enrolled_at": enrollment.created_at,
                "progress": progress_value,
            })

        return success_response(students_data)


class InstructorCourseAnalyticsAPIView(APIView):
    """
    GET /api/instructor/courses/{id}/analytics/ - Lấy thống kê khóa học.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        from apps.enrollments.models import Enrollment, CourseProgress
        from django.db.models import Avg

        course = CourseService.get_course_detail(course_id)
        if not CoursePermissionService.can_view_course(course, request.user):
            return error_response("Bạn không có quyền xem khóa học này.", http_status=status.HTTP_403_FORBIDDEN)

        total_students = Enrollment.objects.filter(course_id=course_id, status=Enrollment.Status.ACTIVE).count()
        avg_progress = CourseProgress.objects.filter(
            enrollment__course_id=course_id,
            enrollment__status=Enrollment.Status.ACTIVE,
        ).aggregate(avg=Avg('progress_percent'))['avg'] or 0

        return success_response({
            "total_students": total_students,
            "average_progress": round(float(avg_progress), 1),
            "course_title": course.title,
            "course_status": course.status,
        })


# ==================== CURRICULUM API ====================


class CourseCurriculumAPIView(APIView):
    """
    GET /api/courses/{course_id}/curriculum/ - Lấy curriculum preview cho public.
    """
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        course_data = CurriculumService.build_public_curriculum(course_id)
        return success_response(course_data)


class CourseCurriculumPreviewAPIView(APIView):
    """
    GET /api/courses/{course_id}/curriculum/preview/ - Lấy curriculum đầy đủ cho admin/instructor.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = CourseService.get_course_detail(course_id)
        if not CoursePermissionService.can_view_course(course, request.user):
            return error_response("Bạn không có quyền xem nội dung khóa học này.", http_status=status.HTTP_403_FORBIDDEN)

        course_data = CurriculumService.build_full_curriculum(course_id)
        return success_response(course_data)


# ==================== CATEGORY ====================


class CategoryListAPIView(APIView):
    """
    GET /api/courses/categories/ - Lấy danh sách danh mục.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Category.objects.all().order_by("name")
        serializer = CategorySerializer(categories, many=True)
        return success_response(serializer.data)


class CategoryCreateAPIView(BasePermissionAPIView):
    """
    POST /api/courses/categories/create/ - Tạo danh mục mới.
    """
    required_permission = "course.category.create"

    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        from django.utils.text import slugify
        category = Category.objects.create(
            name=serializer.validated_data["name"],
            slug=slugify(serializer.validated_data["name"])
        )
        return success_response(CategorySerializer(category).data, "Tạo danh mục thành công.", status.HTTP_201_CREATED)


class CategoryUpdateAPIView(BasePermissionAPIView):
    """
    PATCH /api/courses/categories/{category_id}/update/ - Cập nhật danh mục.
    """
    required_permission = "course.category.update"

    def patch(self, request, category_id):
        category = Category.objects.filter(id=category_id).first()
        if not category:
            return error_response("Không tìm thấy danh mục.", http_status=status.HTTP_404_NOT_FOUND)
        serializer = CategorySerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if "name" in serializer.validated_data:
            from django.utils.text import slugify
            category.name = serializer.validated_data["name"]
            category.slug = slugify(serializer.validated_data["name"])
        category.save()
        return success_response(CategorySerializer(category).data, "Cập nhật danh mục thành công.")


class CategoryDeleteAPIView(BasePermissionAPIView):
    """
    DELETE /api/courses/categories/{category_id}/delete/ - Xóa danh mục.
    """
    required_permission = "course.category.delete"

    def delete(self, request, category_id):
        category = Category.objects.filter(id=category_id).first()
        if not category:
            return error_response("Không tìm thấy danh mục.", http_status=status.HTTP_404_NOT_FOUND)
        category.delete()
        return success_response(None, "Xóa danh mục thành công.")


# ==================== INSTRUCTOR ESSAY GRADING ====================


class InstructorCourseEssaySubmissionsAPIView(APIView):
    """
    GET /api/courses/instructor/{course_id}/essay-submissions/
    Lấy danh sách bài tự luận cần chấm.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = CourseService.get_course_detail(course_id)
        if not CoursePermissionService.can_view_course(course, request.user):
            return error_response("Bạn không có quyền.", http_status=status.HTTP_403_FORBIDDEN)

        data = InstructorCourseService.get_essay_submissions(course_id)
        return success_response(data)


class InstructorCourseGradeEssayAPIView(APIView):
    """
    POST /api/courses/instructor/{course_id}/grade-essay/
    Chấm điểm câu hỏi tự luận.
    Body: { answer_id, score }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id):
        course = CourseService.get_course_detail(course_id)
        if not CoursePermissionService.can_view_course(course, request.user):
            return error_response("Bạn không có quyền.", http_status=status.HTTP_403_FORBIDDEN)

        answer_id = request.data.get("answer_id")
        score = request.data.get("score")

        if not answer_id or score is None:
            return error_response("Thiếu answer_id hoặc score.", http_status=status.HTTP_400_BAD_REQUEST)

        success, message = InstructorCourseService.grade_essay(course_id, answer_id, score)
        if not success:
            return error_response(message, http_status=status.HTTP_400_BAD_REQUEST)

        return success_response(None, message)


# ==================== INSTRUCTOR SEND NOTIFICATION ====================


class InstructorCourseSendNotificationAPIView(APIView):
    """
    POST /api/courses/instructor/{course_id}/send-notification/
    Gửi thông báo tới tất cả học viên trong khóa học.
    Body: { title, body }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id):
        course = CourseService.get_course_detail(course_id)
        if not CoursePermissionService.can_view_course(course, request.user):
            return error_response("Bạn không có quyền.", http_status=status.HTTP_403_FORBIDDEN)

        title = request.data.get("title", "").strip()
        body = request.data.get("body", "").strip()

        if not title or not body:
            return error_response("Vui lòng nhập tiêu đề và nội dung.", http_status=status.HTTP_400_BAD_REQUEST)

        sent_count = InstructorCourseService.send_notification(course_id, title, body)
        return success_response({"sent_count": sent_count}, f"Đã gửi thông báo tới {sent_count} học viên.")


# ==================== INSTRUCTOR Q&A ====================


class InstructorCourseQAAPIView(APIView):
    """
    GET /api/courses/instructor/{course_id}/qa/
    Lấy danh sách câu hỏi Q&A của khóa học.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = CourseService.get_course_detail(course_id)
        if not CoursePermissionService.can_view_course(course, request.user):
            return error_response("Bạn không có quyền.", http_status=status.HTTP_403_FORBIDDEN)
        return success_response([])


class InstructorCourseQAReplyAPIView(APIView):
    """
    POST /api/courses/instructor/{course_id}/qa/{question_id}/reply/
    Trả lời câu hỏi Q&A.
    Body: { content }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id, question_id):
        course = CourseService.get_course_detail(course_id)
        if not CoursePermissionService.can_view_course(course, request.user):
            return error_response("Bạn không có quyền.", http_status=status.HTTP_403_FORBIDDEN)

        content = request.data.get("content", "").strip()
        if not content:
            return error_response("Vui lòng nhập nội dung trả lời.", http_status=status.HTTP_400_BAD_REQUEST)

        return success_response(None, "Đã trả lời câu hỏi.")


# ==================== INSTRUCTOR LEARNING REPORT ====================


class InstructorCourseLearningReportAPIView(APIView):
    """
    GET /api/courses/instructor/{course_id}/learning-report/
    Lấy báo cáo học tập chi tiết của khóa học.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = CourseService.get_course_detail(course_id)
        if not CoursePermissionService.can_view_course(course, request.user):
            return error_response("Bạn không có quyền.", http_status=status.HTTP_403_FORBIDDEN)

        report_data = InstructorCourseService.get_learning_report(course_id)
        return success_response(report_data)
