from rest_framework.exceptions import NotFound
from apps.lessons.models import Chapter
def get_by_id(chapter_id):
    """Lấy chi tiết một chương học theo ID, kèm thông tin course và instructor. Trả về 404 nếu không tìm thấy."""
    chapter = Chapter.objects.select_related("course", "course__assigned_instructor").filter(id=chapter_id).first()
    if not chapter:
        raise NotFound("Không tìm thấy chương học.")
    return chapter
def get_by_course(course_id):
    """Lấy danh sách chương học của một khóa học, sắp xếp theo thứ tự (order)."""
    return Chapter.objects.filter(course_id=course_id).order_by("order")
def create(data):
    """Tạo một chương học mới với dữ liệu đã được validate."""
    return Chapter.objects.create(**data)
def exists_order(course_id, order):
    """Kiểm tra thứ tự chương đã tồn tại trong khóa học hay chưa."""
    return Chapter.objects.filter(course_id=course_id, order=order).exists()
def get_next_order(course_id):
    """Lấy order tiếp theo cho chương mới trong khóa học."""
    last = Chapter.objects.filter(course_id=course_id).order_by("-order").first()
    return (last.order + 1) if last else 1
def update(chapter_id, data):
    """Cập nhật chương học."""
    chapter = get_by_id(chapter_id)
    for key, value in data.items():
        setattr(chapter, key, value)
    chapter.save()
    return chapter
def delete(chapter_id):
    """Xóa chương học."""
    chapter = get_by_id(chapter_id)
    chapter.delete()
