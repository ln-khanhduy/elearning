from rest_framework.permissions import AllowAny
from rest_framework.response import Response
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
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        course = course_service.get_course_detail(course_id)
        # Public API chỉ hiển thị khóa học đã PUBLISHED
        if course.status != "PUBLISHED":
            return error_response("Không tìm thấy khóa học.", http_status=404)
        return success_response(CourseDetailSerializer(course).data)


# ==================== ADMIN COURSE API ====================


class AdminCourseListAPIView(BasePermissionAPIView):
    required_permission = "course.course.view"

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
    required_permission = "course.course.create"

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


class AdminCourseDetailAPIView(BasePermissionAPIView):
    required_permission = "course.course.view"

    def get(self, request, course_id):
        course = course_service.get_course_detail(course_id)
        return success_response(CourseDetailSerializer(course).data)


class AdminCourseUpdateAPIView(BasePermissionAPIView):
    required_permission = "course.course.update"

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
    required_permission = "course.course.delete"

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
    required_permission = "course.course.publish"

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
    required_permission = "course.instructor.assign"

    def patch(self, request, course_id):
        serializer = CourseAssignInstructorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instructor_id = serializer.validated_data.get("instructor_id")
        if instructor_id is None:
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


class AdminCourseAssignedInstructorAPIView(BasePermissionAPIView):
    required_permission = "course.course.view"

    def get(self, request, course_id):
        course = course_service.get_course_detail(course_id)
        data = {
            "assigned_instructor_id": course.assigned_instructor_id,
            "assigned_instructor_name": course.assigned_instructor.get_full_name() if course.assigned_instructor else None,
            "assigned_instructor_avatar": course.assigned_instructor.avatar_url if course.assigned_instructor and hasattr(course.assigned_instructor, 'avatar_url') else None,
        }
        return success_response(data)


# ==================== INSTRUCTOR COURSE API ====================


class InstructorCourseListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        courses = course_assignment_service.get_assigned_courses(request.user)
        serializer = CourseListSerializer(courses, many=True)
        return success_response(serializer.data)


class InstructorCourseDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = course_service.get_course_detail(course_id)
        if not course_permission_service.can_view_course(course, request.user):
            return error_response("Bạn không có quyền xem khóa học này.", http_status=status.HTTP_403_FORBIDDEN)
        return success_response(CourseDetailSerializer(course).data)


class InstructorCourseStudentsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        from apps.enrollments.models import Enrollment
        course = course_service.get_course_detail(course_id)
        if not course_permission_service.can_view_course(course, request.user):
            return error_response("Bạn không có quyền xem khóa học này.", http_status=status.HTTP_403_FORBIDDEN)
        enrollments = Enrollment.objects.filter(course_id=course_id, status=Enrollment.Status.ACTIVE).select_related('student')
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
    permission_classes = [IsAuthenticated]

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
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        course_data = curriculum_service.build_public_curriculum(course_id)
        return success_response(course_data)


class CourseCurriculumPreviewAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = course_service.get_course_detail(course_id)
        if not course_permission_service.can_view_course(course, request.user):
            return error_response("Bạn không có quyền xem nội dung khóa học này.", http_status=status.HTTP_403_FORBIDDEN)
        course_data = curriculum_service.build_full_curriculum(course_id)
        return success_response(course_data)


# ==================== CATEGORY ====================


class CategoryListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Category.objects.all().order_by("name")
        serializer = CategorySerializer(categories, many=True)
        return success_response(serializer.data)


class CategoryCreateAPIView(BasePermissionAPIView):
    required_permission = "course.category.create"

    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        from django.utils.text import slugify
        category = Category.objects.create(name=serializer.validated_data["name"], slug=slugify(serializer.validated_data["name"]))
        return success_response(CategorySerializer(category).data, "Tạo danh mục thành công.", status.HTTP_201_CREATED)


class CategoryUpdateAPIView(BasePermissionAPIView):
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
    required_permission = "course.category.delete"

    def delete(self, request, category_id):
        category = Category.objects.filter(id=category_id).first()
        if not category:
            return error_response("Không tìm thấy danh mục.", http_status=status.HTTP_404_NOT_FOUND)
        category.delete()
        return success_response(None, "Xóa danh mục thành công.")


# ==================== INSTRUCTOR ESSAY GRADING ====================


class InstructorCourseEssaySubmissionsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = course_service.get_course_detail(course_id)
        if not course_permission_service.can_view_course(course, request.user):
            return error_response("Bạn không có quyền.", http_status=status.HTTP_403_FORBIDDEN)
        data = instructor_course_service.get_essay_submissions(course_id)
        return success_response(data)


class InstructorCourseGradeEssayAPIView(APIView):
    permission_classes = [IsAuthenticated]

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


class InstructorCourseSendNotificationAPIView(APIView):
    permission_classes = [IsAuthenticated]

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


class InstructorCourseQAReplyAPIView(APIView):
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


# ==================== STUDENT Q&A ====================


class StudentCourseQuestionListAPIView(APIView):
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


class InstructorCourseLearningReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = course_service.get_course_detail(course_id)
        if not course_permission_service.can_view_course(course, request.user):
            return error_response("Bạn không có quyền.", http_status=status.HTTP_403_FORBIDDEN)
        report_data = instructor_course_service.get_learning_report(course_id)
        return success_response(report_data)