from django.db import models
from django.conf import settings


class Chapter(models.Model):
    """
    Chương học (Section) - nhóm các bài học trong khóa học.
    Mỗi khóa học có nhiều chương, mỗi chương có nhiều bài học.
    """
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='chapters')
    title = models.CharField(max_length=100)        # Tên chương (VD: "Chương 1: Giới thiệu")
    description = models.TextField(null=True, blank=True)  # Mô tả chương
    order = models.IntegerField(default=0)           # Thứ tự hiển thị
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'course_chapter'
        ordering = ['order', 'id']
        unique_together = ('course', 'order')  # Không trùng thứ tự trong cùng khóa học


class Lesson(models.Model):
    """
    Bài học - đơn vị nhỏ nhất của nội dung khóa học.
    Mỗi bài học thuộc một chương và có thể chứa quiz.
    """
    class ContentType(models.TextChoices):
        VIDEO = 'VIDEO', 'Video'
        DOCUMENT = 'DOCUMENT', 'Document'

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        HIDDEN = 'HIDDEN', 'Hidden'
        PUBLISHED = 'PUBLISHED', 'Published'

    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='lessons')
    slug = models.SlugField()                        # URL friendly (unique trong chapter)
    title = models.CharField(max_length=100)          # Tên bài học
    description = models.TextField(null=True, blank=True)
    content_type = models.CharField(max_length=20, choices=ContentType.choices, default=ContentType.VIDEO)
    # URL video (YouTube)
    video_url = models.URLField(null=True, blank=True)
    # File tài liệu (PDF, Word,...)
    material_file = models.FileField(upload_to='lesson_materials/', null=True, blank=True)
    order = models.IntegerField(default=0)            # Thứ tự trong chương
    # Trạng thái bài học (DRAFT / PUBLISHED / HIDDEN)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lesson'
        ordering = ['order', 'id']
        unique_together = ('chapter', 'order')  # Không trùng thứ tự trong cùng chương
