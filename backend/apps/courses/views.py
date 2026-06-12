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
from apps.courses.serializers.category_tag_serializer import CategorySerializer, TagSerializer
from apps.courses.serializers.course_full_create_serializer import CourseFullCreateSerializer
from apps.courses.services.course_full_create_service import CourseFullCreateService
from apps.courses.models import Category, Tag
from apps.lessons.models import Section, Lesson



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
    Chỉ INSTRUCTOR mới được tạo khóa học.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        role_code = user.role.code if user.role else None

        if role_code != "INSTRUCTOR":
            return Response(
                {"detail": "Chỉ giảng viên mới có quyền tạo khóa học."},
                status=status.HTTP_403_FORBIDDEN
            )

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

        return Response({
            "detail": "Tạo khóa học thành công.",
            "course": CourseDetailSerializer(course).data
        }, status=status.HTTP_201_CREATED)


class CourseUpdateAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/ - Cập nhật thông tin khóa học.
    Yêu cầu quyền: course.course.update
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

        return Response({
            "detail": "Cập nhật khóa học thành công.",
            "course": CourseDetailSerializer(course).data
        }, status=status.HTTP_200_OK)


class CourseDeleteAPIView(APIView):
    """
    DELETE /api/courses/{course_id}/ - Xóa khóa học (xóa mềm).
    Yêu cầu quyền: course.course.delete
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

        return Response({"detail": "Xóa khóa học thành công."}, status=status.HTTP_200_OK)


class CourseSubmitReviewAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/submit-review/ - Gửi khóa học chờ duyệt.
    Yêu cầu quyền: course.course.update
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.course.update"

    def patch(self, request, course_id):
        course = CourseService.submit_for_review(course_id, request.user)
        return Response({
            "detail": "Đã gửi khóa học chờ duyệt.",
            "course": CourseDetailSerializer(course).data
        }, status=status.HTTP_200_OK)


class PendingCourseListAPIView(APIView):
    """
    GET /api/courses/pending/ - Lấy danh sách khóa học đang chờ duyệt.
    Yêu cầu quyền: course.course.approve
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.course.approve"

    def get(self, request):
        courses = CourseService.get_pending_courses()
        serializer = CourseListSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CourseApproveAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/approve/ - Duyệt khóa học.
    Yêu cầu quyền: course.course.approve
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

        return Response({
            "detail": "Duyệt khóa học thành công.",
            "course": CourseDetailSerializer(course).data
        }, status=status.HTTP_200_OK)


class CourseRejectAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/reject/ - Từ chối khóa học kèm lý do.
    Yêu cầu quyền: course.course.approve
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

        return Response({
            "detail": "Từ chối khóa học thành công.",
            "course": CourseDetailSerializer(course).data
        }, status=status.HTTP_200_OK)


class CoursePublishAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/publish/ - Public khóa học sau khi đã được duyệt.
    Yêu cầu quyền: course.course.update
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

        return Response({
            "detail": "Public khóa học thành công.",
            "course": CourseDetailSerializer(course).data
        }, status=status.HTTP_200_OK)


class CourseHideAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/hide/ - Ẩn khóa học.
    Yêu cầu quyền: course.course.hide
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.course.hide"

    def patch(self, request, course_id):
        course = CourseService.hide_course(course_id, request.user)
        AdminLogService.log(
            admin=request.user,
            action_type='COURSE_HIDE',
            detail=f"Admin {request.user.email} đã ẩn khóa học '{course.title}' (ID: {course.id})",
            target_id=str(course.id),
            target_type='Course',
        )

        return Response({
            "detail": "Ẩn khóa học thành công.",
            "course": CourseDetailSerializer(course).data
        }, status=status.HTTP_200_OK)


class CourseUnhideAPIView(APIView):
    """
    PATCH /api/courses/{course_id}/unhide/ - Hiện lại khóa học đã ẩn.
    Yêu cầu quyền: course.course.hide
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.course.hide"

    def patch(self, request, course_id):
        course = CourseService.unhide_course(course_id, request.user)
        AdminLogService.log(
            admin=request.user,
            action_type='COURSE_UNHIDE',
            detail=f"Admin {request.user.email} đã hiện lại khóa học '{course.title}' (ID: {course.id})",
            target_id=str(course.id),
            target_type='Course',
        )

        return Response({
            "detail": "Hiện lại khóa học thành công.",
            "course": CourseDetailSerializer(course).data
        }, status=status.HTTP_200_OK)


class CourseFullCreateAPIView(APIView):
    """
    POST /api/courses/create-full/ - Tạo khóa học đầy đủ (kèm chương, bài học, bài tập).
    Chỉ INSTRUCTOR mới được tạo khóa học.
    Ảnh và video bắt buộc phải tải lên Cloudinary thông qua SmartMediaCloudinaryStorage.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        role_code = user.role.code if user.role else None

        if role_code != "INSTRUCTOR":
            return Response(
                {"detail": "Chỉ giảng viên mới có quyền tạo khóa học."},
                status=status.HTTP_403_FORBIDDEN
            )

        import json

        data_str = request.data.get("data")
        if not data_str:
            return Response(
                {"detail": "Thiếu dữ liệu 'data' (JSON string)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            data = json.loads(data_str) if isinstance(data_str, str) else data_str
        except json.JSONDecodeError:
            return Response(
                {"detail": "Dữ liệu 'data' không phải JSON hợp lệ."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Gắn file thumbnail nếu có
        thumbnail_file = request.FILES.get("thumbnail")
        if thumbnail_file:
            data["thumbnail"] = thumbnail_file

        # Gắn file material cho từng bài học
        # File key pattern: lesson_files_{sectionIdx}_{lessonIdx}_material
        sections = data.get("sections", [])
        for si, section in enumerate(sections):
            lessons = section.get("lessons", [])
            for li, lesson in enumerate(lessons):
                material_key = f"lesson_files_{si}_{li}_material"
                if material_key in request.FILES:
                    lesson["material_file"] = request.FILES[material_key]

        serializer = CourseFullCreateSerializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"CourseFullCreate validation errors: {serializer.errors}")
            raise

        course = CourseFullCreateService.create_full_course(user, serializer.validated_data)

        AdminLogService.log(
            admin=request.user,
            action_type='COURSE_CREATE',
            detail=f"{request.user.email} đã tạo khóa học đầy đủ '{course.title}' (ID: {course.id})",
            target_id=str(course.id),
            target_type='Course',
        )

        # Xây dựng map lesson index -> lesson_id để frontend dễ dàng upload video
        lessons_map = {}
        sections_qs = Section.objects.filter(course=course).order_by("order", "id")
        for si, sec in enumerate(sections_qs):
            lessons_qs = Lesson.objects.filter(section=sec).order_by("order", "id")
            for li, les in enumerate(lessons_qs):
                lessons_map[f"{si}-{li}"] = les.id

        return Response({
            "detail": "Tạo khóa học thành công.",
            "course_id": course.id,
            "course_title": course.title,
            "lessons_map": lessons_map,
        }, status=status.HTTP_201_CREATED)


# ==================== CATEGORY ====================

class CategoryListAPIView(APIView):
    """
    GET /api/courses/categories/ - Lấy danh sách danh mục.
    Không yêu cầu đăng nhập.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Category.objects.all().order_by("name")
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CategoryCreateAPIView(APIView):
    """
    POST /api/courses/categories/create/ - Tạo danh mục mới.
    Yêu cầu quyền: course.category.create
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
        return Response(CategorySerializer(category).data, status=status.HTTP_201_CREATED)


class CategoryUpdateAPIView(APIView):
    """
    PATCH /api/courses/categories/{category_id}/update/ - Cập nhật danh mục.
    Yêu cầu quyền: course.category.update
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.category.update"

    def patch(self, request, category_id):
        category = Category.objects.filter(id=category_id).first()
        if not category:
            return Response({"detail": "Không tìm thấy danh mục."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CategorySerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if "name" in serializer.validated_data:
            from django.utils.text import slugify
            category.name = serializer.validated_data["name"]
            category.slug = slugify(serializer.validated_data["name"])
        category.save()
        return Response(CategorySerializer(category).data, status=status.HTTP_200_OK)


class CategoryDeleteAPIView(APIView):
    """
    DELETE /api/courses/categories/{category_id}/delete/ - Xóa danh mục.
    Yêu cầu quyền: course.category.delete
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.category.delete"

    def delete(self, request, category_id):
        category = Category.objects.filter(id=category_id).first()
        if not category:
            return Response({"detail": "Không tìm thấy danh mục."}, status=status.HTTP_404_NOT_FOUND)
        category.delete()
        return Response({"detail": "Xóa danh mục thành công."}, status=status.HTTP_200_OK)


# ==================== TAG ====================

class TagListAPIView(APIView):
    """
    GET /api/courses/tags/ - Lấy danh sách tag.
    Không yêu cầu đăng nhập.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        tags = Tag.objects.all().order_by("name")
        serializer = TagSerializer(tags, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TagCreateAPIView(APIView):
    """
    POST /api/courses/tags/create/ - Tạo tag mới.
    Yêu cầu quyền: course.tag.create
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.tag.create"

    def post(self, request):
        serializer = TagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        from django.utils.text import slugify
        tag = Tag.objects.create(
            name=serializer.validated_data["name"],
            slug=slugify(serializer.validated_data["name"])
        )
        return Response(TagSerializer(tag).data, status=status.HTTP_201_CREATED)


class TagUpdateAPIView(APIView):
    """
    PATCH /api/courses/tags/{tag_id}/update/ - Cập nhật tag.
    Yêu cầu quyền: course.tag.update
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.tag.update"

    def patch(self, request, tag_id):
        tag = Tag.objects.filter(id=tag_id).first()
        if not tag:
            return Response({"detail": "Không tìm thấy tag."}, status=status.HTTP_404_NOT_FOUND)
        serializer = TagSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if "name" in serializer.validated_data:
            from django.utils.text import slugify
            tag.name = serializer.validated_data["name"]
            tag.slug = slugify(serializer.validated_data["name"])
        tag.save()
        return Response(TagSerializer(tag).data, status=status.HTTP_200_OK)


class TagDeleteAPIView(APIView):
    """
    DELETE /api/courses/tags/{tag_id}/delete/ - Xóa tag.
    Yêu cầu quyền: course.tag.delete
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "course.tag.delete"

    def delete(self, request, tag_id):
        tag = Tag.objects.filter(id=tag_id).first()
        if not tag:
            return Response({"detail": "Không tìm thấy tag."}, status=status.HTTP_404_NOT_FOUND)
        tag.delete()
        return Response({"detail": "Xóa tag thành công."}, status=status.HTTP_200_OK)
