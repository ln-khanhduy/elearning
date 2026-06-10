from datetime import timezone

from django.utils.text import slugify
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.courses.repositories.course_repository import CourseRepository


class CourseService:
    @staticmethod
    def search_courses(keyword=None, status_value=None, category_id=None):
        """
        Tìm kiếm và lọc danh sách khóa học dựa trên từ khóa, trạng thái và danh mục.
        Ủy quyền cho Repository thực hiện truy vấn.
        """
        return CourseRepository.search(keyword, status_value, category_id)

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
        Lấy danh sách khóa học đang chờ duyệt (status = pending).
        Ủy quyền cho Repository thực hiện truy vấn.
        """
        return CourseRepository.get_pending_courses()

    @staticmethod
    def create_course(user, validated_data):
        """
        Tạo khóa học mới với trạng thái draft.
        - Gán instructor là user hiện tại
        - Tạo slug từ title
        - Đặt trạng thái mặc định là draft
        """
        validated_data["instructor"] = user
        validated_data["slug"] = slugify(validated_data["title"])
        validated_data["status"] = "draft"
        return CourseRepository.create(validated_data)

    @staticmethod
    def update_course(course_id, user, validated_data):
        """
        Cập nhật thông tin khóa học.
        - Kiểm tra quyền sở hữu (chỉ instructor hoặc SUPERADMIN mới được sửa)
        - Nếu khóa học đã được duyệt hoặc published, đưa về trạng thái pending để duyệt lại
        """
        course = CourseRepository.get_by_id(course_id)

        if course.instructor_id != user.id and user.role.code != "SUPERADMIN":
            raise PermissionDenied("Bạn không có quyền sửa khóa học này.")

        for key, value in validated_data.items():
            setattr(course, key, value)

        if "title" in validated_data:
            course.slug = slugify(validated_data["title"])

        if course.status in ["approved", "published"]:
            course.status = "pending"

        course.save()
        return course

    @staticmethod
    def delete_course(course_id, user):
        """
        Xóa khóa học.
        - Kiểm tra quyền sở hữu (chỉ instructor hoặc SUPERADMIN mới được xóa)
        """
        course = CourseRepository.get_by_id(course_id)

        if course.instructor_id != user.id and user.role.code != "SUPERADMIN":
            raise PermissionDenied("Bạn không có quyền xóa khóa học này.")

        course.delete()

    @staticmethod
    def submit_for_review(course_id, user):
        """
        Gửi khóa học chờ duyệt.
        - Kiểm tra quyền sở hữu
        - Chỉ có thể gửi duyệt nếu khóa học đang ở trạng thái draft hoặc rejected
        """
        course = CourseRepository.get_by_id(course_id)

        if course.instructor_id != user.id:
            raise PermissionDenied("Bạn không có quyền gửi duyệt khóa học này.")

        if course.status not in ["draft", "rejected"]:
            raise ValidationError("Chỉ có thể gửi duyệt khóa học ở trạng thái draft hoặc rejected.")

        course.status = "pending"
        course.save(update_fields=["status"])
        return course

    @staticmethod
    def approve_course(course_id, admin_user):
        """
        Duyệt khóa học.
        - Kiểm tra khóa học đang ở trạng thái pending
        - Cập nhật trạng thái thành approved kèm thông tin người duyệt và thời gian
        """
        course = CourseRepository.get_by_id(course_id)

        if course.status != "pending":
            raise ValidationError({"status": "Chỉ khóa học đang chờ duyệt mới được duyệt."})

        course.status = "approved"
        course.approved_by = admin_user
        course.approved_at = timezone.now()
        course.approval_note = ""
        course.save(update_fields=["status", "approved_by", "approved_at", "approval_note", "updated_at"])
        return course

    @staticmethod
    def reject_course(course_id, admin_user, approval_note):
        """
        Từ chối khóa học kèm lý do.
        - Kiểm tra khóa học đang ở trạng thái pending
        - Cập nhật trạng thái thành rejected kèm lý do từ chối
        """
        course = CourseRepository.get_by_id(course_id)

        if course.status != "pending":
            raise ValidationError({"status": "Chỉ khóa học đang chờ duyệt mới được từ chối."})

        course.status = "rejected"
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
        - Chỉ có thể public nếu khóa học đã được duyệt (approved)
        """
        course = CourseRepository.get_by_id(course_id)

        if course.instructor_id != user.id:
            raise PermissionDenied("Bạn không có quyền public khóa học này.")

        if course.status != "approved":
            raise ValidationError({"status": "Chỉ khóa học đã duyệt mới được public."})

        course.status = "published"
        course.published_at = timezone.now()
        course.save(update_fields=["status", "published_at", "updated_at"])
        return course
