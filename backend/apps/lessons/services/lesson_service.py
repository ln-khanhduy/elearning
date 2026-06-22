from django.db import transaction
from django.utils.text import slugify
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.lessons.models import Lesson
from apps.lessons.repositories.lesson_repository import LessonRepository
from apps.lessons.repositories.chapter_repository import ChapterRepository
from apps.courses.services.course_permission_service import CoursePermissionService


class LessonService:
    @staticmethod
    def _generate_unique_slug(chapter_id, title, exclude_lesson_id=None):
        """
        Tạo slug unique trong phạm vi chapter.
        - base_slug = slugify(title), fallback 'lesson' nếu rỗng
        - Nếu slug đã tồn tại, thêm hậu tố -2, -3, ...
        """
        base_slug = slugify(title) or "lesson"
        slug = base_slug
        counter = 2

        queryset = Lesson.objects.filter(chapter_id=chapter_id, slug=slug)
        if exclude_lesson_id:
            queryset = queryset.exclude(id=exclude_lesson_id)

        while queryset.exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
            queryset = Lesson.objects.filter(chapter_id=chapter_id, slug=slug)
            if exclude_lesson_id:
                queryset = queryset.exclude(id=exclude_lesson_id)

        return slug

    @staticmethod
    def get_lessons_by_chapter(chapter_id):
        """Lấy danh sách bài học trong một chương (ủy quyền cho Repository truy vấn)."""
        return LessonRepository.get_by_chapter(chapter_id)

    @staticmethod
    def get_lesson_detail(lesson_id):
        """Lấy thông tin chi tiết của một bài học (ủy quyền cho Repository truy vấn)."""
        return LessonRepository.get_by_id(lesson_id)

    @staticmethod
    def create_lesson(chapter_id, user, data):
        """
        Tạo bài học mới trong một chương.
        - Kiểm tra quyền quản lý khóa học (chỉ COURSE_ADMIN/SUPERADMIN)
        - Kiểm tra thứ tự bài học không bị trùng
        - Tự sinh slug unique từ title (không raise lỗi nếu trùng slug)
        """
        chapter = ChapterRepository.get_by_id(chapter_id)

        if not CoursePermissionService.can_manage_course(chapter.course, user):
            raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

        order = data.get("order")
        if order is None:
            last = LessonRepository.get_by_chapter(chapter_id).order_by("-order").first()
            data["order"] = (last.order + 1) if last else 1
        elif LessonRepository.exists_order(chapter_id, order):
            raise ValidationError({"order": "Thứ tự bài học đã tồn tại trong chương này."})

        slug = LessonService._generate_unique_slug(chapter_id, data["title"])

        data["chapter_id"] = chapter_id
        data["slug"] = slug
        return LessonRepository.create(data)

    @staticmethod
    def update_lesson(lesson_id, user, data):
        """
        Cập nhật thông tin bài học.
        - Kiểm tra quyền quản lý khóa học (chỉ COURSE_ADMIN/SUPERADMIN)
        - Kiểm tra thứ tự mới không bị trùng (nếu có thay đổi)
        - Nếu title thay đổi, tự sinh slug unique (không raise lỗi nếu trùng slug)
        """
        lesson = LessonRepository.get_by_id(lesson_id)

        if not CoursePermissionService.can_manage_course(lesson.chapter.course, user):
            raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

        new_order = data.get("order")
        if new_order is not None and new_order != lesson.order and LessonRepository.exists_order(lesson.chapter_id, new_order):
            raise ValidationError({"order": "Thứ tự bài học đã tồn tại trong chương này."})

        if "title" in data:
            slug = LessonService._generate_unique_slug(
                lesson.chapter_id, data["title"], exclude_lesson_id=lesson_id
            )
            lesson.slug = slug

        for key, value in data.items():
            setattr(lesson, key, value)

        lesson.save()
        return lesson

    @staticmethod
    def delete_lesson(lesson_id, user):
        """
        Xóa bài học.
        - Kiểm tra quyền quản lý khóa học trước khi xóa (chỉ COURSE_ADMIN/SUPERADMIN)
        """
        lesson = LessonRepository.get_by_id(lesson_id)

        if not CoursePermissionService.can_manage_course(lesson.chapter.course, user):
            raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

        LessonRepository.delete(lesson_id)

    @staticmethod
    def reorder_lessons(chapter_id, user, lessons_data):
        """
        Sắp xếp lại thứ tự các bài học trong một chương.
        - Kiểm tra quyền quản lý khóa học (chỉ COURSE_ADMIN/SUPERADMIN)
        - Kiểm tra danh sách id và order không bị trùng
        - Cập nhật order cho từng bài học trong một transaction
        """
        chapter = ChapterRepository.get_by_id(chapter_id)

        if not CoursePermissionService.can_manage_course(chapter.course, user):
            raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

        ids = [item["id"] for item in lessons_data]
        orders = [item["order"] for item in lessons_data]

        if len(ids) != len(set(ids)):
            raise ValidationError({"id": "Danh sách bài học bị trùng id."})
        if len(orders) != len(set(orders)):
            raise ValidationError({"order": "Thứ tự bài học không được trùng."})

        lessons = LessonRepository.get_by_chapter(chapter_id)
        lesson_map = {lesson.id: lesson for lesson in lessons if lesson.id in ids}

        if len(lesson_map) != len(ids):
            raise ValidationError("Danh sách bài học không hợp lệ.")

        with transaction.atomic():
            for item in lessons_data:
                lesson = lesson_map[item["id"]]
                lesson.order = item["order"]
                lesson.save(update_fields=["order", "updated_at"])

        return LessonRepository.get_by_chapter(chapter_id)
