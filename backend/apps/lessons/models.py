from django.db import models


class Chapter(models.Model):
    """ Phần (Chapter) trong một khóa học, dùng để nhóm các bài học lại với nhau."""
    course = models.ForeignKey('courses.Course',on_delete=models.CASCADE,related_name='chapters')
    # tên phần
    title = models.CharField(max_length=50)
    # mô tả ngắn về phần này
    description = models.TextField(null=True, blank=True)
    # thứ tự hiển thị phần trong khóa học
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'course_chapter'
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
        ('DRAFT', 'Draft'),           # Bản nháp, chưa publish
        ('HIDDEN', 'Hidden'),         # Không publish
        ('PUBLISHED', 'Published'),   # Đã publish, học viên thấy
    )

    #id phần chứa bài học này
    chapter = models.ForeignKey(Chapter,on_delete=models.CASCADE,related_name='lessons')
    # URL dùng trong đường dẫn (VD: /courses/python-co-ban/bai-1-gioi-thieu)
    slug = models.SlugField(max_length=100)
    # Tên bài học
    title = models.CharField(max_length=50)
    # Mô tả ngắn hiển thị trước khi vào bài           
    description = models.TextField(null=True, blank=True) 
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES, default='VIDEO')
    # URL video (YouTube)
    video_url = models.URLField(max_length=500, null=True, blank=True)
    # URL tài liệu đính kèm (PDF/Word), nếu có
    material_file = models.FileField(upload_to="lessons/materials/", null=True, blank=True)
    # Thứ tự trình bày (số nhỏ hơn hiển thị trước)
    order = models.PositiveIntegerField(default=0)
    # Trạng thái bài học (DRAFT / PUBLISHED / HIDDEN)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lesson'
        ordering = ['order', 'id']   # Sắp xếp theo thứ tự 
        indexes = [
            models.Index(fields=['chapter', 'order']),  # Load nhanh
        ]
        constraints = [
            models.UniqueConstraint(fields=["chapter", "slug"],name="unique_chapter_lesson_slug"),            # Mỗi bài học trong cùng một phần phải có slug duy nhất
            models.UniqueConstraint(fields=["chapter", "order"],name="unique_lesson_order_in_chapter")       # Mỗi bài học trong cùng một phần phải có thứ tự duy nhất
        ]    
