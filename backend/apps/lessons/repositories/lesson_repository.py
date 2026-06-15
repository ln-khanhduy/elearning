from rest_framework.exceptions import NotFound
from apps.lessons.models import Lesson


class LessonRepository:
    @staticmethod
    def get_by_id(lesson_id):
        """Lấy chi tiết một bài học theo ID, kèm thông tin chapter (section), course và instructor. Trả về 404 nếu không tìm thấy."""
        lesson = Lesson.objects.select_related("section", "section__course", "section__course__instructor").filter(id=lesson_id).first()
        if not lesson:
            raise NotFound("Không tìm thấy bài học.")
        return lesson

    @staticmethod
    def get_by_chapter(chapter_id):
        """Lấy danh sách bài học trong một chương (section), sắp xếp theo thứ tự (order) và ID."""
        return Lesson.objects.filter(section_id=chapter_id).order_by("order", "id")

    @staticmethod
    def exists_order(chapter_id, order):
        """Kiểm tra thứ tự bài học đã tồn tại trong chương (section) hay chưa."""
        return Lesson.objects.filter(section_id=chapter_id, order=order).exists()

    @staticmethod
    def exists_slug(chapter_id, slug):
        """Kiểm tra slug bài học đã tồn tại trong chương (section) hay chưa."""
        return Lesson.objects.filter(section_id=chapter_id, slug=slug).exists()

    @staticmethod
    def create(data):
        """Tạo một bài học mới với dữ liệu đã được validate."""
        return Lesson.objects.create(**data)

    @staticmethod
    def update(lesson_id, data):
        """Cập nhật bài học."""
        lesson = LessonRepository.get_by_id(lesson_id)
        for key, value in data.items():
            setattr(lesson, key, value)
        lesson.save()
        return lesson

    @staticmethod
    def delete(lesson_id):
        """Xóa bài học."""
        lesson = LessonRepository.get_by_id(lesson_id)
        lesson.delete()
