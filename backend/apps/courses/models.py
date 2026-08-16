import uuid6

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Category(models.Model):
    """
    Danh mục chính của khóa học (phân loại dạng thư mục).
    Mỗi khóa học thuộc đúng 1 category.
    VD: Lập trình, Thiết kế đồ họa, Marketing, Kinh doanh.
    """
    name = models.CharField(max_length=100)   # Tên hiển thị (VD: "Lập trình")
    slug = models.SlugField(unique=True)       # Đường dẫn URL (VD: "lap-trinh")

    class Meta:
        db_table = 'category'
        ordering = ['name']

    def __str__(self):
        return self.name


class CourseSeries(models.Model):
    """
    Nhóm phiên bản khóa học - gom các phiên bản của cùng một khóa
    về mặt quản lý (R4). CourseSeries CHỈ dùng để quản lý;
    Course vẫn là thực thể độc lập; Enrollment trỏ trực tiếp tới Course.
    VD: "ReactJS cơ bản" gồm Course V1-2026, V2-2027, V3-2028.
    """
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        ARCHIVED = 'ARCHIVED', 'Archived'

    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'course_series'
        ordering = ['name']

    def __str__(self):
        return self.name


class CourseSeriesItem(models.Model):
    """
    Bảng nối: Course thuộc CourseSeries.
    Mỗi phiên bản (Course) chỉ thuộc 1 series.
    """
    id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)
    series = models.ForeignKey(CourseSeries, on_delete=models.CASCADE, related_name='items')
    course = models.OneToOneField(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='series_item',
    )
    version = models.CharField(max_length=100, null=True, blank=True)  # VD: "V1 - 2026"
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'course_series_item'
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.series.name} - {self.course.title}"


class Course(models.Model):
    """
    Khóa học - được tạo và quản lý bởi COURSE_ADMIN/SUPERADMIN.
    Giảng viên KHÔNG có quyền CRUD khóa học (Q19).
    KHÔNG còn trường price — giá nằm trong CourseAccessPlan (R2).
    """
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PUBLISHED = 'PUBLISHED', 'Published'
        HIDDEN = 'HIDDEN', 'Hidden'

    # Người tạo khóa học (COURSE_ADMIN hoặc SUPERADMIN)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="created_courses"
    )
    # Giảng viên được phân công phụ trách giảng dạy
    assigned_instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="teaching_courses"
    )
    # id danh mục chính - SET_NULL để không xóa khóa học khi xóa category
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='category_courses')
    title = models.CharField(max_length=100)        # Tên khóa học
    slug = models.SlugField(unique=True)             # URL, dùng trong đường dẫn
    description = models.TextField()                 # Mô tả chi tiết khóa học
    # Ảnh bìa hiển thị trên thẻ khóa học
    thumbnail = models.ImageField(upload_to='course_thumbnails/', null=True, blank=True)
    # URL video giới thiệu (trailer), cho phép học viên xem trước
    preview_video_url = models.URLField(null=True, blank=True)
    # trạng thái khóa học
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    # Thời điểm admin publish
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'course'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),              # Lọc khóa học theo trạng thái + mới nhất
            models.Index(fields=['category']),          # Lọc khóa học theo danh mục
        ]

    def __str__(self):
        return self.title


class CourseAccessPlan(models.Model):
    """
    Gói truy cập của khóa (R2) - mỗi khóa tự khai báo gói riêng
    (tên + thời gian truy cập số ngày + giá riêng). Không có gói chung.
    Không có gói vĩnh viễn (duration_days > 0). Mọi gói đều hoạt động.
    """
    id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='access_plans')
    name = models.CharField(max_length=100)   # Tên gói hiển thị (VD: "Gói 3 ngày", "Gói 1 tháng")
    duration_days = models.PositiveIntegerField()  # Thời gian truy cập (SỐ NGÀY) — 3, 7, 30, 90...
    price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'course_access_plan'
        unique_together = ('course', 'name')  # Mỗi khóa chỉ có 1 gói cùng tên
        ordering = ['duration_days']

    def __str__(self):
        return f"{self.course.title} - {self.name} ({self.duration_days}d) - {self.price:,.0f}đ"


class WishlistItem(models.Model):
    """
    Mục yêu thích - lưu khóa học mà học viên yêu thích để mua sau.
    Mỗi học viên có thể yêu thích nhiều khóa học.
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wishlist_items'
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='wishlisted_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'wishlist_item'
        unique_together = ('student', 'course')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.email} - {self.course.title}"


