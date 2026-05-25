from django.db import models


class Section(models.Model):
    """ Phần (Section) trong một khóa học, dùng để nhóm các bài học lại với nhau."""
    course = models.ForeignKey('courses.Course',on_delete=models.CASCADE,related_name='sections')
    # tên phần
    title = models.CharField(max_length=50)
    # mô tả ngắn về phần này
    description = models.TextField(null=True, blank=True)
    # thứ tự hiển thị phần trong khóa học
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'course_section'
        ordering = ['order', 'id']   # Sắp xếp theo thứ tự 
        indexes = [
            models.Index(fields=['course', 'order']),  # Load nhanh
        ]

class Lesson(models.Model):
    """
    Bài học trong một khóa học.
    Mỗi bài học thuộc 1 course .
    """
    CONTENT_TYPE_CHOICES = (
        ('VIDEO', 'Video'),        # Bài học dạng video (phổ biến nhất)
        ('DOCUMENT', 'Document'),  # Bài học dạng tài liệu PDF/Word
    )

    STATUS_CHOICES = (
        ('HIDDEN', 'Hidden'),         # Không publish
        ('PUBLISHED', 'Published'),   # Đã publish, học viên thấy
        ('HIDDEN', 'Hidden'),         # Ẩn tạm thời
    )

    #id phần chứa bài học này
    section = models.ForeignKey(Section,on_delete=models.CASCADE,related_name='lessons')
    # URL dùng trong đường dẫn (VD: /courses/python-co-ban/bai-1-gioi-thieu)
    slug = models.SlugField(unique=True)
    # Tên bài học
    title = models.CharField(max_length=50)
    # Mô tả ngắn hiển thị trước khi vào bài           
    description = models.TextField(null=True, blank=True) 
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES, default='VIDEO')
    # URL video
    video_url = models.URLField(null=True, blank=True)
    # URL tài liệu đính kèm (PDF/Word), nếu có
    material_url = models.URLField(null=True, blank=True)  
    # Thứ tự trình bày (số nhỏ hơn hiển thị trước)
    order = models.PositiveIntegerField(default=0)
    # Thời lượng bài học (s)
    duration_seconds = models.PositiveIntegerField(default=0)
    # True = bài học miễn phí (không cần đăng ký khóa học)
    is_free = models.BooleanField(default=False)
    # Trạng thái bài học (DRAFT / PUBLISHED / HIDDEN)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lesson'
        ordering = ['order', 'id']   # Sắp xếp theo thứ tự 
        indexes = [
            models.Index(fields=['section', 'order']),  # Load nhanh
        ]
