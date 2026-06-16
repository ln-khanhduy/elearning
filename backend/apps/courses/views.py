from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from apps.common.permissions import HasRequiredPermission
from apps.system.services.admin_log_service import AdminLogService

from apps.courses.services.course_service import CourseService
from apps.courses.serializers.course_serializer import (
    CourseListSerializer, CourseDetailSerializer,
    CourseCreateUpdateSerializer, CourseRejectSerializer,
)
from apps.courses.serializers.category_tag_serializer import CategorySerializer
from apps.courses.models import Category

from apps.lessons.repositories.chapter_repository import ChapterRepository
from apps.lessons.repositories.lesson_repository import LessonRepository
from apps.lessons.serializers.chapter_serializer import ChapterSerializer
from apps.lessons.serializers.lesson_serializer import LessonSerializer, LessonPreviewSerializer
from apps.quizzes.repositories.quiz_repository import QuizRepository
from apps.quizzes.repositories.question_repository import QuestionRepository
from apps.quizzes.serializers.quiz_serializer import QuizSerializer, QuizPreviewSerializer
from apps.quizzes.serializers.question_serializer import QuestionSerializer, QuestionPreviewSerializer




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


class CourseListAPIView(APIView):
    """
    GET /api/courses/ - Lấy danh sách khóa học.
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


class CourseCreateAPIView(APIView):
    """
    POST /api/courses/ - Tạo khóa học mới.
    Chỉ INSTRUCTOR mới được tạo khóa học.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        role_code = user.role.code if user.role else None

        if role_code != "INSTRUCTOR":
            return error_response("Chỉ giảng viên mới có quyền tạo khóa học.", http_status=status.HTTP_403_FORBIDDEN)

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


class CourseUpdateAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/ - Cập nhật thông tin khóa học.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
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


class CourseDeleteAPIView(APIView):
    """
    DELETE /api/courses/{course_id}/ - Xóa khóa học (xóa mềm).
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
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


class CourseSubmitReviewAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/submit-review/ - Gửi khóa học chờ duyệt.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.course.update"

    def patch(self, request, course_id):
        course = CourseService.submit_for_review(course_id, request.user)
        return success_response(CourseDetailSerializer(course).data, "Đã gửi khóa học chờ duyệt.")


class PendingCourseListAPIView(APIView):
    """
    GET /api/courses/pending/ - Lấy danh sách khóa học đang chờ duyệt.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.course.approve"

    def get(self, request):
        courses = CourseService.get_pending_courses()
        serializer = CourseListSerializer(courses, many=True)
        return success_response(serializer.data)


class CourseApproveAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/approve/ - Duyệt khóa học.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.course.approve"

    def patch(self, request, course_id):
        course = CourseService.approve_course(course_id, request.user)
        AdminLogService.log(
            admin=request.user,
            action_type='COURSE_APPROVE',
            detail=f"Admin {request.user.email} đã duyệt khóa học '{course.title}' (ID: {course.id})",
            target_id=str(course.id),
            target_type='Course',
        )

        return success_response(CourseDetailSerializer(course).data, "Duyệt khóa học thành công.")


class CourseRejectAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/reject/ - Từ chối khóa học kèm lý do.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.course.approve"

    def patch(self, request, course_id):
        serializer = CourseRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = CourseService.reject_course(
            course_id, request.user, serializer.validated_data["approval_note"]
        )
        AdminLogService.log(
            admin=request.user,
            action_type='COURSE_REJECT',
            detail=f"Admin {request.user.email} đã từ chối khóa học '{course.title}' (ID: {course.id}). Lý do: {serializer.validated_data['approval_note']}",
            target_id=str(course.id),
            target_type='Course',
        )

        return success_response(CourseDetailSerializer(course).data, "Từ chối khóa học thành công.")


class CoursePublishAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/publish/ - Public khóa học sau khi đã được duyệt.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.course.update"

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


class CourseHideAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/hide/ - Ẩn khóa học.
    - Instructor (chủ sở hữu) và SUPERADMIN được ẩn (kiểm tra trong service).
    """
    permission_classes = [IsAuthenticated]

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


class CourseUnhideAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/unhide/ - Hiện lại khóa học đã ẩn.
    - Instructor (chủ sở hữu) và SUPERADMIN được hiện lại (kiểm tra trong service).
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, course_id):
        course = CourseService.unhide_course(course_id, request.user)
        AdminLogService.log(
            admin=request.user,
            action_type='COURSE_UNHIDE',
            detail=f"Admin {request.user.email} đã hiện lại khóa học '{course.title}' (ID: {course.id})",
            target_id=str(course.id),
            target_type='Course',
        )

        return success_response(CourseDetailSerializer(course).data, "Hiện lại khóa học thành công.")


class CourseCurriculumAPIView(APIView):
    """
    GET /api/courses/{course_id}/curriculum/ - Lấy curriculum preview cho public.
    CHỈ trả về thông tin preview: chapter title, lesson title, content_type, is_free.
    KHÔNG trả về video_url, material_url, quiz questions/options/answers.
    Quiz chỉ trả về: id, title, question_count.
    """
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        course = CourseService.get_course_detail(course_id)
        course_data = CourseDetailSerializer(course).data

        chapters = ChapterRepository.get_by_course(course_id)
        chapters_data = []
        for chapter in chapters:
            chapter_data = ChapterSerializer(chapter).data

            lessons = LessonRepository.get_by_chapter(chapter.id)
            lessons_data = []
            for lesson in lessons:
                # Dùng LessonPreviewSerializer - KHÔNG expose video_url, material_url
                lesson_data = LessonPreviewSerializer(lesson).data

                # Public: chỉ trả quiz title + question_count, KHÔNG trả questions
                quizzes = QuizRepository.get_by_lesson(lesson.id)
                quizzes_data = QuizPreviewSerializer(quizzes, many=True).data
                lesson_data["quizzes"] = quizzes_data
                lessons_data.append(lesson_data)

            chapter_data["lessons"] = lessons_data
            chapters_data.append(chapter_data)

        course_data["chapters"] = chapters_data
        return success_response(course_data)


class CourseCurriculumPreviewAPIView(APIView):
    """
    GET /api/courses/{course_id}/curriculum/preview/ - Lấy curriculum đầy đủ cho instructor/admin.
    Chỉ instructor (chủ sở hữu) và admin mới được preview nội dung đầy đủ.
    Trả về: video_url, material_url, quiz questions/options (KHÔNG có is_correct).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = CourseService.get_course_detail(course_id)
        user = request.user
        role_code = user.role.code if user.role else None

        # Kiểm tra quyền: instructor chủ sở hữu hoặc admin
        is_owner = course.instructor == user
        is_admin = role_code in ("SUPERADMIN", "ADMIN")
        if not is_owner and not is_admin:
            return error_response("Bạn không có quyền xem nội dung khóa học này.", http_status=status.HTTP_403_FORBIDDEN)

        course_data = CourseDetailSerializer(course).data

        chapters = ChapterRepository.get_by_course(course_id)
        chapters_data = []
        for chapter in chapters:
            chapter_data = ChapterSerializer(chapter).data

            lessons = LessonRepository.get_by_chapter(chapter.id)
            lessons_data = []
            for lesson in lessons:
                # Dùng LessonSerializer đầy đủ - có video_url, material_url
                lesson_data = LessonSerializer(lesson).data

                quizzes = QuizRepository.get_by_lesson(lesson.id)
                quizzes_data = []
                for quiz in quizzes:
                    quiz_data = QuizSerializer(quiz).data

                    questions = QuestionRepository.get_by_quiz(quiz.id)
                    # Dùng QuestionPreviewSerializer - KHÔNG expose is_correct, correct_text_answer
                    questions_data = QuestionPreviewSerializer(questions, many=True).data
                    quiz_data["questions"] = questions_data
                    quizzes_data.append(quiz_data)

                lesson_data["quizzes"] = quizzes_data
                lessons_data.append(lesson_data)

            chapter_data["lessons"] = lessons_data
            chapters_data.append(chapter_data)

        course_data["chapters"] = chapters_data
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


class CategoryCreateAPIView(APIView):
    """
    POST /api/courses/categories/create/ - Tạo danh mục mới.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
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


class CategoryUpdateAPIView(APIView):
    """
    PATCH /api/courses/categories/{category_id}/update/ - Cập nhật danh mục.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
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


class CategoryDeleteAPIView(APIView):
    """
    DELETE /api/courses/categories/{category_id}/delete/ - Xóa danh mục.
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.category.delete"

    def delete(self, request, category_id):
        category = Category.objects.filter(id=category_id).first()
        if not category:
            return error_response("Không tìm thấy danh mục.", http_status=status.HTTP_404_NOT_FOUND)
        category.delete()
        return success_response(None, "Xóa danh mục thành công.")

