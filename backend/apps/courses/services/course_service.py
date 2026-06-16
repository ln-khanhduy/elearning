from django.utils import timezone
from django.utils.text import slugify
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.courses.repositories.course_repository import CourseRepository


class CourseService:
    """Service quản lý khóa học - tạo, cập nhật, xóa, gửi duyệt, duyệt/từ chối, public."""

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
    def get_pending_courses():
        """
        Lấy danh sách khóa học đang chờ duyệt (status = PENDING).
        Ủy quyền cho Repository thực hiện truy vấn.
        """
        return CourseRepository.get_pending_courses()

    @staticmethod
    def create_course(user, validated_data):
        """
        Tạo khóa học mới với trạng thái PENDING.
        - Gán instructor là user hiện tại
        - Tạo slug từ title
        - Đặt trạng thái mặc định là PENDING
        """
        validated_data["instructor"] = user
        base_slug = slugify(validated_data["title"])
        slug = base_slug
        counter = 1
        from apps.courses.models import Course
        while Course.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        validated_data["slug"] = slug
        validated_data["status"] = "PENDING"
        return CourseRepository.create(validated_data)

    @staticmethod
    def update_course(course_id, user, validated_data):
        """
        Cập nhật thông tin khóa học.
        - Kiểm tra quyền sở hữu (chỉ instructor hoặc SUPERADMIN mới được sửa)
        - Nếu khóa học đã APPROVED hoặc PUBLISHED, giữ nguyên trạng thái (không đưa về PENDING)
        - Chỉ đưa về PENDING nếu khóa học đang ở REJECTED (cần duyệt lại)
        - Khóa học mới tạo (PENDING) giữ nguyên PENDING
        """
        course = CourseRepository.get_by_id(course_id)

        if course.instructor_id != user.id and user.role.code != "SUPERADMIN":
            raise PermissionDenied("Bạn không có quyền sửa khóa học này.")

        for key, value in validated_data.items():
            setattr(course, key, value)

        if "title" in validated_data:
            course.slug = slugify(validated_data["title"])

        # Chỉ đưa về PENDING nếu khóa học đang bị từ chối (cần duyệt lại)
        # Không đưa về PENDING nếu đã APPROVED hoặc PUBLISHED
        if course.status == "REJECTED":
            course.status = "PENDING"

        course.save()
        return course

    @staticmethod
    def delete_course(course_id, user):
        """
        Xóa khóa học (xóa mềm).
        - Kiểm tra quyền sở hữu (chỉ instructor hoặc SUPERADMIN mới được xóa)
        """
        course = CourseRepository.get_by_id(course_id)

        if course.instructor_id != user.id and user.role.code != "SUPERADMIN":
            raise PermissionDenied("Bạn không có quyền xóa khóa học này.")

        course.status = "DELETED"
        course.save(update_fields=["status"])

    @staticmethod
    def submit_for_review(course_id, user):
        """
        Gửi khóa học chờ duyệt.
        - Kiểm tra quyền sở hữu
        - Chỉ có thể gửi duyệt nếu khóa học đang ở trạng thái REJECTED
        """
        course = CourseRepository.get_by_id(course_id)

        if course.instructor_id != user.id:
            raise PermissionDenied("Bạn không có quyền gửi duyệt khóa học này.")

        if course.status not in ["REJECTED"]:
            raise ValidationError("Chỉ có thể gửi duyệt khóa học ở trạng thái REJECTED.")

        course.status = "PENDING"
        course.save(update_fields=["status"])
        return course

    @staticmethod
    def approve_course(course_id, admin_user):
        """
        Duyệt khóa học.
        - Kiểm tra khóa học đang ở trạng thái PENDING
        - Cập nhật trạng thái thành APPROVED kèm thông tin người duyệt và thời gian
        """
        course = CourseRepository.get_by_id(course_id)

        if course.status != "PENDING":
            raise ValidationError({"status": "Chỉ khóa học đang chờ duyệt mới được duyệt."})

        course.status = "APPROVED"
        course.approved_by = admin_user
        course.approved_at = timezone.now()
        course.approval_note = ""
        course.save(update_fields=["status", "approved_by", "approved_at", "approval_note", "updated_at"])
        return course

    @staticmethod
    def reject_course(course_id, admin_user, approval_note):
        """
        Từ chối khóa học kèm lý do.
        - Kiểm tra khóa học đang ở trạng thái PENDING
        - Cập nhật trạng thái thành REJECTED kèm lý do từ chối
        """
        course = CourseRepository.get_by_id(course_id)

        if course.status != "PENDING":
            raise ValidationError({"status": "Chỉ khóa học đang chờ duyệt mới được từ chối."})

        course.status = "REJECTED"
        course.approved_by = admin_user
        course.approved_at = timezone.now()
        course.approval_note = approval_note
        course.save(update_fields=["status", "approved_by", "approved_at", "approval_note", "updated_at"])
        return course

    @staticmethod
    def publish_course(course_id, user):
        """
        Public khóa học sau khi đã được duyệt.
        - Kiểm tra quyền sở hữu
        - Chỉ có thể public nếu khóa học đã được duyệt (APPROVED)
        """
        course = CourseRepository.get_by_id(course_id)

        if course.instructor_id != user.id:
            raise PermissionDenied("Bạn không có quyền public khóa học này.")

        if course.status != "APPROVED":
            raise ValidationError({"status": "Chỉ khóa học đã duyệt mới được public."})

        course.status = "PUBLISHED"
        course.published_at = timezone.now()
        course.save(update_fields=["status", "published_at", "updated_at"])
        return course

    @staticmethod
    def hide_course(course_id, user):
        """
        Ẩn khóa học (HIDDEN).
        - Chỉ instructor (chủ sở hữu) mới được ẩn khóa học của mình.
        - Chỉ có thể ẩn nếu khóa học đang PUBLISHED
        """
        course = CourseRepository.get_by_id(course_id)

        if course.instructor_id != user.id:
            raise PermissionDenied("Bạn không có quyền ẩn khóa học này.")

        if course.status != "PUBLISHED":
            raise ValidationError({"status": "Chỉ khóa học đã public mới có thể ẩn."})

        course.status = "HIDDEN"
        course.save(update_fields=["status", "updated_at"])
        return course

    @staticmethod
    def unhide_course(course_id, user):
        """
        Hiện lại khóa học đã ẩn (PUBLISHED).
        - Chỉ instructor (chủ sở hữu) mới được hiện lại khóa học của mình.
        - Chỉ có thể hiện lại nếu khóa học đang HIDDEN
        """
        course = CourseRepository.get_by_id(course_id)

        if course.instructor_id != user.id:
            raise PermissionDenied("Bạn không có quyền hiện lại khóa học này.")

        if course.status != "HIDDEN":
            raise ValidationError({"status": "Chỉ khóa học đang ẩn mới có thể hiện lại."})

        course.status = "PUBLISHED"
        course.save(update_fields=["status", "updated_at"])
        return course
