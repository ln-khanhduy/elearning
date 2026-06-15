from rest_framework.exceptions import NotFound
from apps.lessons.models import Chapter


class ChapterRepository:
    @staticmethod
    def get_by_id(chapter_id):
        """Lấy chi tiết một chương học theo ID, kèm thông tin course và instructor. Trả về 404 nếu không tìm thấy."""
        chapter = Chapter.objects.select_related("course", "course__instructor").filter(id=chapter_id).first()
        if not chapter:
            raise NotFound("Không tìm thấy chương học.")
        return chapter

    @staticmethod
    def get_by_course(course_id):
        """Lấy danh sách chương học của một khóa học, sắp xếp theo thứ tự (order)."""
        return Chapter.objects.filter(course_id=course_id).order_by("order")

    @staticmethod
    def create(data):
        """Tạo một chương học mới với dữ liệu đã được validate."""
        return Chapter.objects.create(**data)

    @staticmethod
    def exists_order(course_id, order):
        """Kiểm tra thứ tự chương đã tồn tại trong khóa học hay chưa."""
        return Chapter.objects.filter(course_id=course_id, order=order).exists()
