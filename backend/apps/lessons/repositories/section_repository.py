from rest_framework.exceptions import NotFound
from apps.lessons.models import Section


class SectionRepository:
    @staticmethod
    def get_by_id(section_id):
        """Lấy chi tiết một chương học theo ID, kèm thông tin course và instructor. Trả về 404 nếu không tìm thấy."""
        section = Section.objects.select_related("course", "course__instructor").filter(id=section_id).first()
        if not section:
            raise NotFound("Không tìm thấy chương học.")
        return section

    @staticmethod
    def get_by_course(course_id):
        """Lấy danh sách chương học của một khóa học, sắp xếp theo thứ tự (order)."""
        return Section.objects.filter(course_id=course_id).order_by("order")

    @staticmethod
    def create(data):
        """Tạo một chương học mới với dữ liệu đã được validate."""
        return Section.objects.create(**data)

    @staticmethod
    def exists_order(course_id, order):
        """Kiểm tra thứ tự chương đã tồn tại trong khóa học hay chưa."""
        return Section.objects.filter(course_id=course_id, order=order).exists()
