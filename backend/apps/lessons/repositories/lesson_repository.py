from rest_framework.exceptions import NotFound
from apps.lessons.models import Lesson


class LessonRepository:
    @staticmethod
    def get_by_id(lesson_id):
        lesson = Lesson.objects.select_related("section", "section__course", "section__course__instructor").filter(id=lesson_id).first()
        if not lesson:
            raise NotFound("Không tìm thấy bài học.")
        return lesson

    @staticmethod
    def get_by_section(section_id):
        return Lesson.objects.filter(section_id=section_id).order_by("order", "id")

    @staticmethod
    def exists_order(section_id, order):
        return Lesson.objects.filter(section_id=section_id, order=order).exists()

    @staticmethod
    def exists_slug(section_id, slug):
        return Lesson.objects.filter(section_id=section_id, slug=slug).exists()

    @staticmethod
    def create(data):
        return Lesson.objects.create(**data)