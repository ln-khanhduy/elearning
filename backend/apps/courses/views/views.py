from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.common.base_api_view import BasePermissionAPIView
from apps.system.services import admin_log_service
from apps.notifications import services as notif_service

from apps.courses.services import course_service
from apps.courses.services import course_assignment_service
from apps.courses.services import course_permission_service
from apps.courses.services import curriculum_service
from apps.courses.services import instructor_course_service
from apps.courses.serializers.course_serializer import (
    CourseListSerializer, CourseDetailSerializer,
    CourseCreateUpdateSerializer, CourseAssignInstructorSerializer,
)
from apps.courses.serializers.category_tag_serializer import CategorySerializer
from apps.courses.serializers.qa_serializer import (
    CourseQuestionListSerializer, CourseQuestionDetailSerializer,
    CourseQuestionCreateSerializer, CourseAnswerCreateSerializer,
    CourseAnswerSerializer,
)
from apps.courses.models import Category
from apps.common.response_helpers import success_response, error_response


# ==================== PUBLIC COURSE API ====================


class CourseListAPIView(APIView):
    """GET /api/courses/ - Danh sách khóa học công khai (có tìm kiếm, lọc theo trạng thái/category, phân trang)."""
    permission_classes = [AllowAny]

    def get(self, request):
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 10))
        # Public API chỉ hiển thị khóa học đã PUBLISHED
        courses = course_service.search_courses(
            keyword=request.GET.get("q"),
            status_value=request.GET.get("status") or "PUBLISHED",
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
    """GET /api/courses/{course_id}/ - Chi tiết khóa học công khai."""
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        course = course_service.get_course_detail(course_id)
        # Public API chỉ hiển thị khóa học đã PUBLISHED
        if course.status != "PUBLISHED":
            return error_response("Không tìm thấy khóa học.", http_status=404)
        return success_response(CourseDetailSerializer(course).data)


# ==================== ADMIN COURSE API ====================


class AdminCourseListAPIView(APIView):
    """GET /api/admin/courses/ - Danh sách khóa học cho admin."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 10))
        courses = course_service.search_courses(
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
    """POST /api/admin/courses/ - Tạo khóa học mới."""
    required_permission = "course.course.manage"

    def post(self, request):
        serializer = CourseCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = course_service.create_course(request.user, serializer.validated_data)
        admin_log_service.log(
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


class AdminCourseDetailAPIView(APIView):
    """GET /api/admin/courses/{course_id}/ - Chi tiết khóa học cho admin."""
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = course_service.get_course_detail(course_id)
        return success_response(CourseDetailSerializer(course).data)


class AdminCourseUpdateAPIView(BasePermissionAPIView):
    """PATCH /api/admin/courses/{course_id}/ - Cập nhật thông tin khóa học."""
    required_permission = "course.course.manage"

    def patch(self, request, course_id):
        serializer = CourseCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        course = course_service.update_course(course_id, request.user, serializer.validated_data)
        admin_log_service.log(
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
    """DELETE /api/admin/courses/{course_id}/ - Xóa khóa học."""
    required_permission = "course.course.manage"

    def delete(self, request, course_id):
        course = course_service.get_course_detail(course_id)
        course_title = course.title
        course_id_str = str(course.id)
        course_service.delete_course(course_id, request.user)
        admin_log_service.log(
            admin=request.user,
            action_type='COURSE_DELETE',
            detail=f"Admin {request.user.email} đã xóa khóa học '{course_title}' (ID: {course_id_str})",
            target_id=course_id_str,
            target_type='Course',
        )
        return success_response(None, "Xóa khóa học thành công.")


class AdminCoursePublishAPIView(BasePermissionAPIView):
    """PATCH /api/admin/courses/{course_id}/publish/ - Xuất bản khóa học lên công khai."""
    required_permission = "course.course.publish"

    def patch(self, request, course_id):
        course = course_service.publish_course(course_id, request.user)
        admin_log_service.log(
            admin=request.user,
            action_type='COURSE_PUBLISH',
            detail=f"Admin {request.user.email} đã xuất bản khóa học '{course.title}' (ID: {course.id})",
            target_id=str(course.id),
            target_type='Course',
        )
        try:
            if course.assigned_instructor:
                notif_service.notify_course_published(course.assigned_instructor, course.title)
        except Exception:
            pass
        return success_response(CourseDetailSerializer(course).data, "Public khóa học thành công.")


class AdminCourseHideAPIView(BasePermissionAPIView):
    """PATCH /api/admin/courses/{course_id}/hide/ - Ẩn khóa học khỏi công khai."""
    required_permission = "course.course.hide"

    def patch(self, request, course_id):
        course = course_service.hide_course(course_id, request.user)
        admin_log_service.log(
            admin=request.user,
            action_type='COURSE_HIDE',
            detail=f"Admin {request.user.email} đã ẩn khóa học '{course.title}' (ID: {course.id})",
            target_id=str(course.id),
            target_type='Course',
        )
        try:
            if course.assigned_instructor:
                notif_service.notify_course_hidden(course.assigned_instructor, course.title)
        except Exception:
            pass
        return success_response(CourseDetailSerializer(course).data, "Ẩn khóa học thành công.")



class AdminCourseAssignInstructorAPIView(BasePermissionAPIView):
    """PATCH /api/admin/courses/{course_id}/assign/ - Phân công hoặc gỡ giảng viên phụ trách khóa học."""
    required_permission = "course.instructor.assign"

    def patch(self, request, course_id):
        serializer = CourseAssignInstructorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instructor_id = serializer.validated_data.get("instructor_id")
        if not instructor_id:
            course = course_assignment_service.remove_instructor(course_id, request.user)
            admin_log_service.log(
                admin=request.user,
                action_type='COURSE_REMOVE_INSTRUCTOR',
                detail=f"Admin {request.user.email} đã gỡ giảng viên khỏi khóa học '{course.title}' (ID: {course.id})",
                target_id=str(course.id),
                target_type='Course',
            )
            return success_response(CourseDetailSerializer(course).data, "Đã gỡ giảng viên khỏi khóa học.")
        else:
            course = course_assignment_service.assign_instructor(course_id, instructor_id, request.user)
            instructor_name = course.assigned_instructor.get_full_name() if course.assigned_instructor else "N/A"
            admin_log_service.log(
                admin=request.user,
                action_type='COURSE_ASSIGN_INSTRUCTOR',
                detail=f"Admin {request.user.email} đã phân công giảng viên '{instructor_name}' (ID: {course.assigned_instructor_id}) cho khóa học '{course.title}' (ID: {course.id})",
                target_id=str(course.id),
                target_type='Course',
            )
            return success_response(CourseDetailSerializer(course).data, "Phân công giảng viên thành công.")


class AdminCourseAssignedInstructorAPIView(APIView):
    """GET /api/admin/courses/{course_id}/assigned-instructor/ - Lấy thông tin giảng viên được phân công."""
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = course_service.get_course_detail(course_id)
        data = {
            "assigned_instructor_id": course.assigned_instructor_id,
            "assigned_instructor_name": course.assigned_instructor.get_full_name() if course.assigned_instructor else None,
            "assigned_instructor_avatar": course.assigned_instructor.avatar_url if course.assigned_instructor and hasattr(course.assigned_instructor, 'avatar_url') else None,
        }
        return success_response(data)


# ==================== INSTRUCTOR COURSE API ====================


class InstructorCourseListAPIView(BasePermissionAPIView):
    """GET /api/instructor/courses/ - Danh sách khóa học được phân công giảng dạy cho instructor hiện tại."""
    required_permission = "instructor.course.view_own"

    def get(self, request):
        courses = course_assignment_service.get_assigned_courses(request.user)
        serializer = CourseListSerializer(courses, many=True)
        return success_response(serializer.data)


class InstructorCourseDetailAPIView(BasePermissionAPIView):
    """GET /api/instructor/courses/{course_id}/ - Chi tiết khóa học giảng dạy của instructor."""
    required_permission = "instructor.course.view_own"

    def get(self, request, course_id):
        course = course_service.get_course_detail(course_id)
        if not course_permission_service.can_view_course(course, request.user):
            return error_response("Bạn không có quyền xem khóa học này.", http_status=status.HTTP_403_FORBIDDEN)
        return success_response(CourseDetailSerializer(course).data)


class InstructorCourseStudentsAPIView(BasePermissionAPIView):
    """GET /api/instructor/courses/{course_id}/students/ - Danh sách học viên đã đăng ký khóa học (kèm tiến độ)."""
    required_permission = "instructor.course.view_own"

    def get(self, request, course_id):
        from apps.enrollments.models import Enrollment
        course = course_service.get_course_detail(course_id)
        if not course_permission_service.can_view_course(course, request.user):
            return error_response("Bạn không có quyền xem khóa học này.", http_status=status.HTTP_403_FORBIDDEN)
        enrollments = Enrollment.objects.filter(course_id=course_id, status=Enrollment.Status.ACTIVE).select_related('student', 'progress')
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


class InstructorCourseAnalyticsAPIView(BasePermissionAPIView):
    """GET /api/instructor/courses/{course_id}/analytics/ - Thống kê phân tích khóa học (số học viên, tiến độ trung bình)."""
    required_permission = "instructor.course.view_own"

    def get(self, request, course_id):
        from apps.enrollments.models import Enrollment, CourseProgress
        from django.db.models import Avg
        course = course_service.get_course_detail(course_id)
        if not course_permission_service.can_view_course(course, request.user):
            return error_response("Bạn không có quyền xem khóa học này.", http_status=status.HTTP_403_FORBIDDEN)
        total_students = Enrollment.objects.filter(course_id=course_id, status=Enrollment.Status.ACTIVE).count()
        avg_progress = CourseProgress.objects.filter(
            enrollment__course_id=course_id, enrollment__status=Enrollment.Status.ACTIVE,
        ).aggregate(avg=Avg('progress_percent'))['avg'] or 0
        return success_response({
            "total_students": total_students,
            "average_progress": round(float(avg_progress), 1),
            "course_title": course.title,
            "course_status": course.status,
        })


# ==================== CURRICULUM API ====================


class CourseCurriculumAPIView(APIView):
    """GET /api/courses/{course_id}/curriculum/ - Lấy cấu trúc công khai (chương/bài) cho khách xem thử."""
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        course_data = curriculum_service.build_public_curriculum(course_id)
        return success_response(course_data)


class CourseCurriculumPreviewAPIView(APIView):
    """GET /api/courses/{course_id}/curriculum/preview/ - Lấy cấu trúc đầy đủ cho user đã đăng ký học."""
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = course_service.get_course_detail(course_id)
        if not course_permission_service.can_view_course(course, request.user):
            return error_response("Bạn không có quyền xem nội dung khóa học này.", http_status=status.HTTP_403_FORBIDDEN)
        course_data = curriculum_service.build_full_curriculum(course_id)
        return success_response(course_data)


# ==================== CATEGORY ====================


class CategoryListAPIView(APIView):
    """GET /api/categories/ - Danh sách danh mục công khai."""
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Category.objects.all().order_by("name")
        serializer = CategorySerializer(categories, many=True)
        return success_response(serializer.data)


class CategoryCreateAPIView(BasePermissionAPIView):
    """POST /api/categories/ - Tạo danh mục mới."""
    required_permission = "course.category.manage"

    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        from django.utils.text import slugify
        category = Category.objects.create(name=serializer.validated_data["name"], slug=slugify(serializer.validated_data["name"]))
        return success_response(CategorySerializer(category).data, "Tạo danh mục thành công.", status.HTTP_201_CREATED)


class CategoryUpdateAPIView(BasePermissionAPIView):
    """PATCH /api/categories/{category_id}/ - Cập nhật danh mục."""
    required_permission = "course.category.manage"

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
    """DELETE /api/categories/{category_id}/ - Xóa danh mục."""
    required_permission = "course.category.manage"

    def delete(self, request, category_id):
        category = Category.objects.filter(id=category_id).first()
        if not category:
            return error_response("Không tìm thấy danh mục.", http_status=status.HTTP_404_NOT_FOUND)
        category.delete()
        return success_response(None, "Xóa danh mục thành công.")


# ==================== INSTRUCTOR ESSAY GRADING ====================


class InstructorCourseEssaySubmissionsAPIView(BasePermissionAPIView):
    """GET /api/instructor/courses/{course_id}/essays/ - Danh sách bài tập tự luận cần chấm của khóa học."""
    required_permission = "instructor.course.teaching"

    def get(self, request, course_id):
        course = course_service.get_course_detail(course_id)
        if not course_permission_service.can_view_course(course, request.user):
            return error_response("Bạn không có quyền.", http_status=status.HTTP_403_FORBIDDEN)
        data = instructor_course_service.get_essay_submissions(course_id)
        return success_response(data)


class InstructorCourseGradeEssayAPIView(BasePermissionAPIView):
    """POST /api/instructor/courses/{course_id}/essays/{answer_id}/grade/ - Chấm điểm bài tập tự luận."""
    required_permission = "instructor.course.teaching"

    def post(self, request, course_id):
        course = course_service.get_course_detail(course_id)
        if not course_permission_service.can_view_course(course, request.user):
            return error_response("Bạn không có quyền.", http_status=status.HTTP_403_FORBIDDEN)
        answer_id = request.data.get("answer_id")
        score = request.data.get("score")
        if not answer_id or score is None:
            return error_response("Thiếu answer_id hoặc score.", http_status=status.HTTP_400_BAD_REQUEST)
        success, message = instructor_course_service.grade_essay(course_id, answer_id, score)
        if not success:
            return error_response(message, http_status=status.HTTP_400_BAD_REQUEST)
        return success_response(None, message)


# ==================== INSTRUCTOR SEND NOTIFICATION ====================


class InstructorCourseSendNotificationAPIView(BasePermissionAPIView):
    """POST /api/instructor/courses/{course_id}/notify/ - Gửi thông báo tới toàn bộ học viên của khóa học."""
    required_permission = "instructor.course.teaching"

    def post(self, request, course_id):
        course = course_service.get_course_detail(course_id)
        if not course_permission_service.can_view_course(course, request.user):
            return error_response("Bạn không có quyền.", http_status=status.HTTP_403_FORBIDDEN)
        title = request.data.get("title", "").strip()
        body = request.data.get("body", "").strip()
        if not title or not body:
            return error_response("Vui lòng nhập tiêu đề và nội dung.", http_status=status.HTTP_400_BAD_REQUEST)
        sent_count = instructor_course_service.send_notification(course_id, title, body)
        return success_response({"sent_count": sent_count}, f"Đã gửi thông báo tới {sent_count} học viên.")


# ==================== INSTRUCTOR Q&A ====================


class InstructorCourseQAAPIView(APIView):
    """GET /api/instructor/courses/{course_id}/qa/ - Danh sách câu hỏi Q&A của khóa học (giảng viên xem)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = course_service.get_course_detail(course_id)
        if not course_permission_service.can_view_course(course, request.user):
            return error_response("Bạn không có quyền.", http_status=status.HTTP_403_FORBIDDEN)
        result = instructor_course_service.get_questions(
            course_id, status=request.GET.get("status"), lesson_id=request.GET.get("lesson_id"),
            page=int(request.GET.get("page", 1)), page_size=int(request.GET.get("page_size", 20)),
        )
        serializer = CourseQuestionListSerializer(result.get("questions", []), many=True)
        return success_response({
            "questions": serializer.data, "total": result.get("total", 0),
            "page": result.get("page", 1), "total_pages": result.get("total_pages", 1),
            "has_next": result.get("has_next", False), "has_previous": result.get("has_previous", False),
        })


class InstructorCourseQAReplyAPIView(BasePermissionAPIView):
    """POST /api/instructor/courses/{course_id}/qa/{question_id}/reply/ - Giảng viên trả lời câu hỏi của học viên."""
    required_permission = "instructor.course.teaching"

    def post(self, request, course_id, question_id):
        course = course_service.get_course_detail(course_id)
        if not course_permission_service.can_view_course(course, request.user):
            return error_response("Bạn không có quyền.", http_status=status.HTTP_403_FORBIDDEN)
        question = instructor_course_service.get_question_detail(question_id)
        if not question or question.course_id != course_id:
            return error_response("Không tìm thấy câu hỏi.", http_status=status.HTTP_404_NOT_FOUND)
        serializer = CourseAnswerCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answer = instructor_course_service.reply_question(question, request.user, serializer.validated_data['content'])
        return success_response(CourseAnswerSerializer(answer).data, "Đã trả lời câu hỏi.")


# ==================== STUDENT Q&A ====================


class StudentCourseQuestionListAPIView(APIView):
    """GET /api/student/courses/{course_id}/qa/ - Danh sách câu hỏi Q&A của khóa học (học viên xem)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = course_service.get_course_detail(course_id)
        if not course_permission_service.can_view_course(course, request.user):
            return error_response("Bạn không có quyền.", http_status=status.HTTP_403_FORBIDDEN)
        result = instructor_course_service.get_questions(
            course_id, status=request.GET.get("status"), lesson_id=request.GET.get("lesson_id"),
            page=int(request.GET.get("page", 1)), page_size=int(request.GET.get("page_size", 20)),
        )
        serializer = CourseQuestionListSerializer(result.get("questions", []), many=True)
        return success_response({
            "questions": serializer.data, "total": result.get("total", 0),
            "page": result.get("page", 1), "total_pages": result.get("total_pages", 1),
            "has_next": result.get("has_next", False), "has_previous": result.get("has_previous", False),
        })


class StudentCourseQuestionCreateAPIView(APIView):
    """POST /api/student/courses/{course_id}/qa/ - Học viên đặt câu hỏi mới trong khóa học."""
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id):
        course = course_service.get_course_detail(course_id)
        if not course_permission_service.can_view_course(course, request.user):
            return error_response("Bạn không có quyền.", http_status=status.HTTP_403_FORBIDDEN)
        serializer = CourseQuestionCreateSerializer(data={**request.data, "course": course_id})
        serializer.is_valid(raise_exception=True)
        question = instructor_course_service.create_question(course, request.user, serializer.validated_data)
        return success_response(CourseQuestionDetailSerializer(question).data, "Đã đặt câu hỏi thành công.", http_status=status.HTTP_201_CREATED)


class StudentCourseQuestionDetailAPIView(APIView):
    """GET /api/student/courses/{course_id}/qa/{question_id}/ - Chi tiết câu hỏi + các câu trả lời."""
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id, question_id):
        course = course_service.get_course_detail(course_id)
        if not course_permission_service.can_view_course(course, request.user):
            return error_response("Bạn không có quyền.", http_status=status.HTTP_403_FORBIDDEN)
        question = instructor_course_service.get_question_detail(question_id)
        if not question or question.course_id != course_id:
            return error_response("Không tìm thấy câu hỏi.", http_status=status.HTTP_404_NOT_FOUND)
        return success_response(CourseQuestionDetailSerializer(question).data)


class StudentCourseQuestionReplyAPIView(APIView):
    """POST /api/student/courses/{course_id}/qa/{question_id}/reply/ - Học viên trả lời câu hỏi Q&A."""
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id, question_id):
        course = course_service.get_course_detail(course_id)
        if not course_permission_service.can_view_course(course, request.user):
            return error_response("Bạn không có quyền.", http_status=status.HTTP_403_FORBIDDEN)
        question = instructor_course_service.get_question_detail(question_id)
        if not question or question.course_id != course_id:
            return error_response("Không tìm thấy câu hỏi.", http_status=status.HTTP_404_NOT_FOUND)
        serializer = CourseAnswerCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answer = instructor_course_service.reply_question(question, request.user, serializer.validated_data['content'])
        return success_response(CourseAnswerSerializer(answer).data, "Đã trả lời câu hỏi.")


class StudentCourseQuestionCloseAPIView(APIView):
    """POST /api/student/courses/{course_id}/qa/{question_id}/close/ - Chủ câu hỏi đóng câu hỏi Q&A."""
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id, question_id):
        course = course_service.get_course_detail(course_id)
        if not course_permission_service.can_view_course(course, request.user):
            return error_response("Bạn không có quyền.", http_status=status.HTTP_403_FORBIDDEN)
        question = instructor_course_service.get_question_detail(question_id)
        if not question or question.course_id != course_id:
            return error_response("Không tìm thấy câu hỏi.", http_status=status.HTTP_404_NOT_FOUND)
        if question.student_id != request.user.id:
            return error_response("Bạn không có quyền đóng câu hỏi này.", http_status=status.HTTP_403_FORBIDDEN)
        instructor_course_service.close_question(question)
        return success_response(None, "Đã đóng câu hỏi.")


# ==================== INSTRUCTOR LEARNING REPORT ====================

class InstructorCourseLearningReportAPIView(BasePermissionAPIView):
    """GET /api/instructor/courses/{course_id}/report/ - Báo cáo tình hình học tập của học viên trong khóa học."""
    required_permission = "instructor.course.teaching"

    def get(self, request, course_id):
        course = course_service.get_course_detail(course_id)
        if not course_permission_service.can_view_course(course, request.user):
            return error_response("Bạn không có quyền.", http_status=status.HTTP_403_FORBIDDEN)
        report_data = instructor_course_service.get_learning_report(course_id)
        return success_response(report_data)