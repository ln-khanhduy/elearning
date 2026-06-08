from django.db import transaction
from django.utils.text import slugify
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.lessons.models import Lesson
from apps.lessons.repositories.lesson_repository import LessonRepository
from apps.lessons.repositories.section_repository import SectionRepository


class LessonService:
    @staticmethod
    def check_course_owner(course, user):
        if user.role and user.role.code == "SUPERADMIN":
            return
        if course.instructor_id != user.id:
            raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    @staticmethod
    def create_lesson(section_id, user, data):
        section = SectionRepository.get_by_id(section_id)
        LessonService.check_course_owner(section.course, user)

        if LessonRepository.exists_order(section_id, data["order"]):
            raise ValidationError({"order": "Thứ tự bài học đã tồn tại trong chương này."})

        slug = slugify(data["title"])
        if LessonRepository.exists_slug(section_id, slug):
            raise ValidationError({"title": "Tên bài học đã tồn tại trong chương này."})

        data["section"] = section
        data["slug"] = slug
        return LessonRepository.create(data)

    @staticmethod
    def update_lesson(lesson_id, user, data):
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
        lesson = LessonRepository.get_by_id(lesson_id)
        LessonService.check_course_owner(lesson.section.course, user)
        lesson.delete()

    @staticmethod
    def reorder_lessons(section_id, user, lessons_data):
        section = SectionRepository.get_by_id(section_id)
        LessonService.check_course_owner(section.course, user)

        ids = [item["id"] for item in lessons_data]
        orders = [item["order"] for item in lessons_data]

        if len(ids) != len(set(ids)):
            raise ValidationError({"id": "Danh sách bài học bị trùng id."})
        if len(orders) != len(set(orders)):
            raise ValidationError({"order": "Thứ tự bài học không được trùng."})

        lessons = Lesson.objects.filter(section_id=section_id, id__in=ids)
        lesson_map = {lesson.id: lesson for lesson in lessons}

        if len(lesson_map) != len(ids):
            raise ValidationError("Danh sách bài học không hợp lệ.")

        with transaction.atomic():
            for item in lessons_data:
                lesson = lesson_map[item["id"]]
                lesson.order = item["order"]
                lesson.save(update_fields=["order", "updated_at"])

        return LessonRepository.get_by_section(section_id)