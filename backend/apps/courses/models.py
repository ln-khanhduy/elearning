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
        db_table = 'course_category'
        ordering = ['name']


class Course(models.Model):
    """
    Khóa học - được tạo và quản lý bởi COURSE_ADMIN.
    Instructor chỉ là người được phân công phụ trách giảng dạy.
    """
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),           # Bản nháp, đang xây dựng nội dung
        ('PUBLISHED', 'Published'),   # Đang bán, học viên có thể đăng ký
        ('HIDDEN', 'Hidden'),         # Tạm ẩn (admin ẩn, không hiện trên store)
    )

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
    # Giá gốc (VNĐ)
    price = models.DecimalField(max_digits=10, decimal_places=2,validators=[MinValueValidator(0)])
    # trạng thái khóa học
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
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
