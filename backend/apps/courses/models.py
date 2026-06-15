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
    Khóa học
    """
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),       # Đã nộp, đang chờ Course Admin duyệt
        ('APPROVED', 'Approved'),     # Đã duyệt, chưa công bố (giảng viên chưa nhấn publish)
        ('REJECTED', 'Rejected'),     # Bị từ chối, giảng viên cần chỉnh sửa lại
        ('PUBLISHED', 'Published'),   # Đang bán, học viên có thể đăng ký
        ('HIDDEN', 'Hidden'),         # Tạm ẩn (admin hoặc giảng viên ẩn, không hiện trên store)
        ('DELETED', 'Deleted'),       # Đã xóa mềm, không thể khôi phục qua UI
    )

    #  id giảng viên tạo khóa học 
    instructor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='courses')
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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    # Ghi chú của admin khi duyệt hoặc từ chối (học viên không thấy)
    approval_note = models.TextField(null=True, blank=True)
    # Admin đã duyệt khóa học này
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,null=True,blank=True,related_name='approved_courses',)
    # Thời điểm admin duyệt
    approved_at = models.DateTimeField(null=True, blank=True)
    # Thời điểm giảng viên nhấn "Publish" để bắt đầu bán
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