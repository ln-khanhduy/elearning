from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.courses.repositories.course_repository import CourseRepository
from apps.courses.services.course_permission_service import CoursePermissionService
from apps.lessons.repositories.chapter_repository import ChapterRepository


class ChapterService:
    @staticmethod
    def get_chapters_by_course(course_id):
        """Lấy danh sách chương học của một khóa học (ủy quyền cho Repository truy vấn)."""
        return ChapterRepository.get_by_course(course_id)

    @staticmethod
    def create_chapter(course_id, user, validated_data):
        """
        Tạo chương học mới trong khóa học.
        - Kiểm tra quyền quản lý khóa học (chỉ COURSE_ADMIN/SUPERADMIN)
        - Kiểm tra thứ tự chương không bị trùng
        - Tự động gợi ý order tiếp theo nếu không được cung cấp
        """
        course = CourseRepository.get_by_id(course_id)

        if not CoursePermissionService.can_manage_course(course, user):
            raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

        order = validated_data.get("order")
        if order is None:
            order = ChapterRepository.get_next_order(course_id)
            validated_data["order"] = order
        elif ChapterRepository.exists_order(course_id, order):
            raise ValidationError({"order": "Thứ tự chương đã tồn tại trong khóa học này."})

        validated_data["course"] = course
        return ChapterRepository.create(validated_data)

    @staticmethod
    def update_chapter(chapter_id, user, validated_data):
        """
        Cập nhật thông tin chương học.
        - Kiểm tra quyền quản lý khóa học (chỉ COURSE_ADMIN/SUPERADMIN)
        - Kiểm tra thứ tự mới không bị trùng (nếu có thay đổi)
        """
        chapter = ChapterRepository.get_by_id(chapter_id)

        if not CoursePermissionService.can_manage_course(chapter.course, user):
            raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

        new_order = validated_data.get("order")
        if new_order is not None and new_order != chapter.order:
            if ChapterRepository.exists_order(chapter.course_id, new_order):
                raise ValidationError({"order": "Thứ tự chương đã tồn tại trong khóa học này."})

        for key, value in validated_data.items():
            setattr(chapter, key, value)

        chapter.save()
        return chapter

    @staticmethod
    def delete_chapter(chapter_id, user):
        """
        Xóa chương học.
        - Kiểm tra quyền quản lý khóa học trước khi xóa (chỉ COURSE_ADMIN/SUPERADMIN)
        """
        chapter = ChapterRepository.get_by_id(chapter_id)

        if not CoursePermissionService.can_manage_course(chapter.course, user):
            raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

        ChapterRepository.delete(chapter_id)

    @staticmethod
    def reorder_chapter(course_id, user, chapter_data):
        """
        Sắp xếp lại thứ tự các chương học trong khóa học.
        - Kiểm tra quyền quản lý khóa học (chỉ COURSE_ADMIN/SUPERADMIN)
        - Kiểm tra danh sách order không bị trùng
        - Cập nhật order cho từng chương trong một transaction
        """
        course = CourseRepository.get_by_id(course_id)

        if not CoursePermissionService.can_manage_course(course, user):
            raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

        chapter_ids = [item.get("id") for item in chapter_data]
        orders = [item.get("order") for item in chapter_data]

        if len(orders) != len(set(orders)):
            raise ValidationError({"order": "Thứ tự chương không được trùng."})

        chapters = ChapterRepository.get_by_course(course_id)
        chapter_map = {ch.id: ch for ch in chapters if ch.id in chapter_ids}

        if len(chapter_map) != len(chapter_ids):
            raise ValidationError("Danh sách chương không hợp lệ.")

        with transaction.atomic():
            for item in chapter_data:
                ch = chapter_map.get(item.get("id"))
                if not ch:
                    raise ValidationError("Danh sách chương không hợp lệ.")
                ch.order = item.get("order")
                ch.save(update_fields=["order", "updated_at"])

        return ChapterRepository.get_by_course(course_id)
