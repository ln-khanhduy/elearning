from rest_framework.exceptions import NotFound
from apps.lessons.models import Section

class SectionRepository:
    @staticmethod
    def get_by_id(section_id):
        section = Section.objects.select_related("course", "course__instructor").filter(id=section_id).first()
        if not section:
            raise NotFound("Không tìm thấy chương học.")
        return section

    @staticmethod
    def get_by_course(course_id):
        return Section.objects.filter(course_id=course_id).order_by("order")

    @staticmethod
    def create(data):
        return Section.objects.create(**data)

    @staticmethod
    def exists_order(course_id, order):
        return Section.objects.filter(course_id=course_id, order=order).exists()