from rest_framework.exceptions import NotFound
from apps.courses.models import Course


class CourseRepository:
    @staticmethod
    def get_all():
        """Lấy danh sách tất cả khóa học, kèm thông tin instructor và category, sắp xếp theo ngày tạo mới nhất."""
        return Course.objects.select_related("instructor", "category").all().order_by("-created_at")

    @staticmethod
    def get_by_id(course_id):
        """Lấy chi tiết một khóa học theo ID, kèm thông tin instructor và category. Trả về 404 nếu không tìm thấy."""
        course = Course.objects.select_related("instructor", "category").filter(id=course_id).first()
        if not course:
            raise NotFound("Không tìm thấy khóa học.")
        return course

    @staticmethod
    def get_pending_courses():
        """Lấy danh sách khóa học đang chờ duyệt (status = pending), sắp xếp theo thời gian cập nhật."""
        return Course.objects.select_related("instructor", "category").filter(status="pending").order_by("-updated_at")

    @staticmethod
    def create(data):
        """Tạo một khóa học mới với dữ liệu đã được validate."""
        return Course.objects.create(**data)

    @staticmethod
    def search(keyword=None, status_value=None, category_id=None):
        """
        Tìm kiếm khóa học theo từ khóa (title), lọc theo trạng thái và danh mục.
        - keyword: tìm kiếm không phân biệt hoa thường trong title
        - status_value: lọc theo trạng thái (draft, pending, approved, rejected, published)
        - category_id: lọc theo danh mục
        """
        listcourse = CourseRepository.get_all()

        if keyword:
            listcourse = listcourse.filter(title__icontains=keyword)

        if status_value:
            listcourse = listcourse.filter(status=status_value)

        if category_id:
            listcourse = listcourse.filter(category_id=category_id)
        return listcourse

    @staticmethod
    def exitst_by_id(course_id):
        """Kiểm tra khóa học có tồn tại trong hệ thống hay không dựa trên ID."""
        return Course.objects.filter(id=course_id).exists()
