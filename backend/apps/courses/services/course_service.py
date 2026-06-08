from datetime import timezone

from django.utils.text import slugify
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.courses.repositories.course_repository import CourseRepository


class CourseService:
    @staticmethod
    def create_course(user, validated_data):
        validated_data["instructor"] = user
        validated_data["slug"] = slugify(validated_data["title"])
        validated_data["status"] = "draft"
        return CourseRepository.create(validated_data)

    @staticmethod
    def update_course(course_id, user, validated_data):
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
        course = CourseRepository.get_by_id(course_id)

        if course.instructor_id != user.id and user.role.code != "SUPERADMIN":
            raise PermissionDenied("Bạn không có quyền xóa khóa học này.")

        course.delete()

    @staticmethod
    def submit_for_review(course_id, user):
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
        course = CourseRepository.get_by_id(course_id)

        if course.instructor_id != user.id:
            raise PermissionDenied("Bạn không có quyền public khóa học này.")

        if course.status != "approved":
            raise ValidationError({"status": "Chỉ khóa học đã duyệt mới được public."})

        course.status = "published"
        course.published_at = timezone.now()
        course.save(update_fields=["status", "published_at", "updated_at"])
        return course