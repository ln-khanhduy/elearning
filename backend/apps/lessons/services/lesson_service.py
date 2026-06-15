from django.db import transaction
from django.utils.text import slugify
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.lessons.repositories.lesson_repository import LessonRepository
from apps.lessons.repositories.chapter_repository import ChapterRepository


class LessonService:
    @staticmethod
    def check_course_owner(course, user):
        """Kiểm tra user có phải là chủ sở hữu khóa học không. SUPERADMIN luôn được phép."""
        if user.role and user.role.code == "SUPERADMIN":
            return
        if course.instructor_id != user.id:
            raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

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
        - Kiểm tra quyền sở hữu khóa học
        - Kiểm tra thứ tự bài học không bị trùng
        - Tạo slug từ title và kiểm tra không bị trùng slug trong cùng chương
        """
        chapter = ChapterRepository.get_by_id(chapter_id)
        LessonService.check_course_owner(chapter.course, user)

        order = data.get("order")
        if order is None:
            last = LessonRepository.get_by_chapter(chapter_id).order_by("-order").first()
            data["order"] = (last.order + 1) if last else 1
        elif LessonRepository.exists_order(chapter_id, order):
            raise ValidationError({"order": "Thứ tự bài học đã tồn tại trong chương này."})

        slug = slugify(data["title"])
        if LessonRepository.exists_slug(chapter_id, slug):
            raise ValidationError({"title": "Tên bài học đã tồn tại trong chương này."})

        data["section_id"] = chapter_id
        data["slug"] = slug
        return LessonRepository.create(data)

    @staticmethod
    def update_lesson(lesson_id, user, data):
        """
        Cập nhật thông tin bài học.
        - Kiểm tra quyền sở hữu khóa học
        - Kiểm tra thứ tự mới không bị trùng (nếu có thay đổi)
        - Kiểm tra title mới không bị trùng slug (nếu có thay đổi)
        """
        lesson = LessonRepository.get_by_id(lesson_id)
        LessonService.check_course_owner(lesson.section.course, user)

        new_order = data.get("order")
        if new_order is not None and new_order != lesson.order and LessonRepository.exists_order(lesson.section_id, new_order):
            raise ValidationError({"order": "Thứ tự bài học đã tồn tại trong chương này."})

        if "title" in data:
            slug = slugify(data["title"])
            if slug != lesson.slug and LessonRepository.exists_slug(lesson.section_id, slug):
                raise ValidationError({"title": "Tên bài học đã tồn tại trong chương này."})
            lesson.slug = slug

        for key, value in data.items():
            setattr(lesson, key, value)

        lesson.save()
        return lesson

    @staticmethod
    def delete_lesson(lesson_id, user):
        """
        Xóa bài học.
        - Kiểm tra quyền sở hữu khóa học trước khi xóa
        """
        lesson = LessonRepository.get_by_id(lesson_id)
        LessonService.check_course_owner(lesson.section.course, user)
        LessonRepository.delete(lesson_id)

    @staticmethod
    def reorder_lessons(chapter_id, user, lessons_data):
        """
        Sắp xếp lại thứ tự các bài học trong một chương.
        - Kiểm tra quyền sở hữu khóa học
        - Kiểm tra danh sách id và order không bị trùng
        - Cập nhật order cho từng bài học trong một transaction
        """
        chapter = ChapterRepository.get_by_id(chapter_id)
        LessonService.check_course_owner(chapter.course, user)

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
