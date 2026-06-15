from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.courses.repositories.course_repository import CourseRepository
from apps.lessons.models import Chapter
from apps.lessons.repositories.chapter_repository import ChapterRepository


class ChapterService:
    @staticmethod
    def check_course_owner(course, user):
        """Kiểm tra user có phải là chủ sở hữu khóa học không. SUPERADMIN luôn được phép."""
        if user.role and user.role.code == "SUPERADMIN":
            return
        if course.instructor_id != user.id:
            raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    @staticmethod
    def get_chapters_by_course(course_id):
        """Lấy danh sách chương học của một khóa học (ủy quyền cho Repository truy vấn)."""
        return ChapterRepository.get_by_course(course_id)

    @staticmethod
    def create_chapter(course_id, user, validated_data):
        """
        Tạo chương học mới trong khóa học.
        - Kiểm tra quyền sở hữu khóa học
        - Kiểm tra thứ tự chương không bị trùng
        """
        course = CourseRepository.get_by_id(course_id)
        ChapterRepository.check_course_owner(course, user)

        if ChapterRepository.exists_order(course_id, validated_data["order"]):
            raise ValidationError({"order": "Thứ tự chương đã tồn tại trong khóa học này."})

        validated_data["course"] = course
        return ChapterRepository.create(validated_data)

    @staticmethod
    def update_chapter(chapter_id, user, validated_data):
        """
        Cập nhật thông tin chương học.
        - Kiểm tra quyền sở hữu khóa học
        - Kiểm tra thứ tự mới không bị trùng (nếu có thay đổi)
        """
        chapter = ChapterRepository.get_by_id(chapter_id)
        ChapterRepository.check_course_owner(chapter.course, user)

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
        - Kiểm tra quyền sở hữu khóa học trước khi xóa
        """
        chapter = ChapterRepository.get_by_id(chapter_id)
        ChapterRepository.check_course_owner(chapter.course, user)
        chapter.delete()

    @staticmethod
    def reorder_chapter(course_id, user, chapter_data):
        """
        Sắp xếp lại thứ tự các chương học trong khóa học.
        - Kiểm tra quyền sở hữu khóa học
        - Kiểm tra danh sách order không bị trùng
        - Cập nhật order cho từng chương trong một transaction
        """
        course = CourseRepository.get_by_id(course_id)
        ChapterRepository.check_course_owner(course, user)

        chapter_ids = [item.get("id") for item in chapter_data]
        orders = [item.get("order") for item in chapter_data]

        if len(orders) != len(set(orders)):
            raise ValidationError({"order": "Thứ tự chương không được trùng."})

        chapter = Chapter.objects.filter(course_id=course_id, id__in=chapter_ids)
        chapter_map = {chapter.id: chapter for chapter in chapter}

        with transaction.atomic():
            for item in chapter_data:
                chapter = chapter_map.get(item.get("id"))
                if not chapter:
                    raise ValidationError("Danh sách chương không hợp lệ.")
                chapter.order = item.get("order")
                chapter.save(update_fields=["order", "updated_at"])

        return ChapterRepository.get_by_course(course_id)
