from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.courses.repositories.course_repository import CourseRepository
from apps.lessons.models import Section
from apps.lessons.repositories.section_repository import SectionRepository


class SectionService:
    @staticmethod
    def check_course_owner(course, user):
        """Kiểm tra user có phải là chủ sở hữu khóa học không. SUPERADMIN luôn được phép."""
        if user.role and user.role.code == "SUPERADMIN":
            return
        if course.instructor_id != user.id:
            raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    @staticmethod
    def get_sections_by_course(course_id):
        """Lấy danh sách chương học của một khóa học (ủy quyền cho Repository truy vấn)."""
        return SectionRepository.get_by_course(course_id)

    @staticmethod
    def create_section(course_id, user, validated_data):
        """
        Tạo chương học mới trong khóa học.
        - Kiểm tra quyền sở hữu khóa học
        - Kiểm tra thứ tự chương không bị trùng
        """
        course = CourseRepository.get_by_id(course_id)
        SectionService.check_course_owner(course, user)

        if SectionRepository.exists_order(course_id, validated_data["order"]):
            raise ValidationError({"order": "Thứ tự chương đã tồn tại trong khóa học này."})

        validated_data["course"] = course
        return SectionRepository.create(validated_data)

    @staticmethod
    def update_section(section_id, user, validated_data):
        """
        Cập nhật thông tin chương học.
        - Kiểm tra quyền sở hữu khóa học
        - Kiểm tra thứ tự mới không bị trùng (nếu có thay đổi)
        """
        section = SectionRepository.get_by_id(section_id)
        SectionService.check_course_owner(section.course, user)

        new_order = validated_data.get("order")
        if new_order is not None and new_order != section.order:
            if SectionRepository.exists_order(section.course_id, new_order):
                raise ValidationError({"order": "Thứ tự chương đã tồn tại trong khóa học này."})

        for key, value in validated_data.items():
            setattr(section, key, value)

        section.save()
        return section

    @staticmethod
    def delete_section(section_id, user):
        """
        Xóa chương học.
        - Kiểm tra quyền sở hữu khóa học trước khi xóa
        """
        section = SectionRepository.get_by_id(section_id)
        SectionService.check_course_owner(section.course, user)
        section.delete()

    @staticmethod
    def reorder_sections(course_id, user, sections_data):
        """
        Sắp xếp lại thứ tự các chương học trong khóa học.
        - Kiểm tra quyền sở hữu khóa học
        - Kiểm tra danh sách order không bị trùng
        - Cập nhật order cho từng chương trong một transaction
        """
        course = CourseRepository.get_by_id(course_id)
        SectionService.check_course_owner(course, user)

        section_ids = [item.get("id") for item in sections_data]
        orders = [item.get("order") for item in sections_data]

        if len(orders) != len(set(orders)):
            raise ValidationError({"order": "Thứ tự chương không được trùng."})

        sections = Section.objects.filter(course_id=course_id, id__in=section_ids)
        section_map = {section.id: section for section in sections}

        with transaction.atomic():
            for item in sections_data:
                section = section_map.get(item.get("id"))
                if not section:
                    raise ValidationError("Danh sách chương không hợp lệ.")
                section.order = item.get("order")
                section.save(update_fields=["order", "updated_at"])

        return SectionRepository.get_by_course(course_id)
