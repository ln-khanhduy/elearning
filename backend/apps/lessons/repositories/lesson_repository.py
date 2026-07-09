from rest_framework.exceptions import NotFound
from apps.lessons.models import Lesson

def get_by_id(lesson_id):
    """Lấy chi tiết một bài học theo ID, kèm thông tin chapter, course và instructor. Trả về 404 nếu không tìm thấy."""
    lesson = Lesson.objects.select_related("chapter", "chapter__course", "chapter__course__assigned_instructor").filter(id=lesson_id).first()
    if not lesson:
        raise NotFound("Không tìm thấy bài học.")
    return lesson

def get_by_chapter(chapter_id):
    """Lấy danh sách bài học trong một chương, sắp xếp theo thứ tự (order) và ID."""
    return Lesson.objects.filter(chapter_id=chapter_id).order_by("order", "id")

def exists_order(chapter_id, order):
    """Kiểm tra thứ tự bài học đã tồn tại trong chương hay chưa."""
    return Lesson.objects.filter(chapter_id=chapter_id, order=order).exists()

def exists_slug(chapter_id, slug):
    """Kiểm tra slug bài học đã tồn tại trong chương hay chưa."""
    return Lesson.objects.filter(chapter_id=chapter_id, slug=slug).exists()

def create(data):
    """Tạo một bài học mới với dữ liệu đã được validate."""
    return Lesson.objects.create(**data)

def update(lesson_id, data):
    """Cập nhật bài học."""
    lesson = get_by_id(lesson_id)
    for key, value in data.items():
        setattr(lesson, key, value)
    lesson.save()
    return lesson

def delete(lesson_id):
    """Xóa bài học."""
    lesson = get_by_id(lesson_id)
    lesson.delete()

def get_by_course(course_id):
    """Lấy danh sách bài học của một khóa học."""
    return Lesson.objects.filter(chapter__course_id=course_id)

def count_by_course(course_id):
    """Đếm số bài học của một khóa học."""
    return Lesson.objects.filter(chapter__course_id=course_id).count()
