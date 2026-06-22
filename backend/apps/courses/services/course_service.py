from django.utils import timezone
from django.utils.text import slugify
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.courses.repositories.course_repository import CourseRepository
from apps.courses.services.course_permission_service import CoursePermissionService


class CourseService:
    """Service quản lý khóa học - tạo, cập nhật, xóa, publish, hide."""

    @staticmethod
    def search_courses(keyword=None, status_value=None, category_id=None, instructor_id=None):
        """
        Tìm kiếm và lọc danh sách khóa học dựa trên từ khóa, trạng thái, danh mục và instructor.
        Ủy quyền cho Repository thực hiện truy vấn.
        """
        return CourseRepository.search(keyword, status_value, category_id, instructor_id)

    @staticmethod
    def get_course_detail(course_id):
        """
        Lấy thông tin chi tiết của một khóa học theo ID.
        Ủy quyền cho Repository thực hiện truy vấn.
        """
        return CourseRepository.get_by_id(course_id)

    @staticmethod
    def create_course(user, validated_data):
        """
        Tạo khóa học mới với trạng thái DRAFT.
        - Gán created_by là user hiện tại (COURSE_ADMIN hoặc SUPERADMIN)
        - Tạo slug từ title
        - Đặt trạng thái mặc định là DRAFT
        """
        validated_data["created_by"] = user
        base_slug = slugify(validated_data["title"])
        slug = base_slug
        counter = 1
        from apps.courses.models import Course
        while Course.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        validated_data["slug"] = slug
        validated_data["status"] = "DRAFT"
        return CourseRepository.create(validated_data)

    @staticmethod
    def update_course(course_id, user, validated_data):
        """
        Cập nhật thông tin khóa học.
        - Kiểm tra quyền quản lý (chỉ COURSE_ADMIN hoặc SUPERADMIN mới được sửa)
        """
        course = CourseRepository.get_by_id(course_id)

        if not CoursePermissionService.can_manage_course(course, user):
            raise PermissionDenied("Bạn không có quyền sửa khóa học này.")

        for key, value in validated_data.items():
            setattr(course, key, value)

        if "title" in validated_data:
            course.slug = slugify(validated_data["title"])

        course.save()
        return course

    @staticmethod
    def delete_course(course_id, user):
        """
        Xóa khóa học vĩnh viễn.
        - Kiểm tra quyền quản lý (chỉ COURSE_ADMIN hoặc SUPERADMIN mới được xóa)
        """
        course = CourseRepository.get_by_id(course_id)

        if not CoursePermissionService.can_manage_course(course, user):
            raise PermissionDenied("Bạn không có quyền xóa khóa học này.")

        course.delete()

    @staticmethod
    def publish_course(course_id, user):
        """
        Public khóa học.
        - Chỉ COURSE_ADMIN hoặc SUPERADMIN mới được publish.
        - Chỉ có thể publish nếu khóa học đang DRAFT hoặc HIDDEN.
        """
        course = CourseRepository.get_by_id(course_id)

        if not CoursePermissionService.can_publish_course(course, user):
            raise PermissionDenied("Bạn không có quyền public khóa học này.")

        if course.status not in ["DRAFT", "HIDDEN"]:
            raise ValidationError({"status": "Chỉ khóa học ở trạng thái DRAFT hoặc HIDDEN mới được public."})

        course.status = "PUBLISHED"
        course.published_at = timezone.now()
        course.save(update_fields=["status", "published_at", "updated_at"])
        return course

    @staticmethod
    def hide_course(course_id, user):
        """
        Ẩn khóa học (HIDDEN).
        - Chỉ COURSE_ADMIN hoặc SUPERADMIN mới được ẩn.
        - Chỉ có thể ẩn nếu khóa học đang PUBLISHED.
        """
        course = CourseRepository.get_by_id(course_id)

        if not CoursePermissionService.can_publish_course(course, user):
            raise PermissionDenied("Bạn không có quyền ẩn khóa học này.")

        if course.status != "PUBLISHED":
            raise ValidationError({"status": "Chỉ khóa học đã public mới có thể ẩn."})

        course.status = "HIDDEN"
        course.save(update_fields=["status", "updated_at"])
        return course
