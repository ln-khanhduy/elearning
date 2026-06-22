from django.conf import settings
from django.db import models


class Review(models.Model):
    """
    Đánh giá / bình luận khóa học.
    Hỗ trợ nested replies (parent-child) để tạo luồng thảo luận.
    """
    class Status(models.TextChoices):
        PUBLISHED = 'PUBLISHED', 'Published'
        HIDDEN = 'HIDDEN', 'Hidden'
        DELETED = 'DELETED', 'Deleted'

    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    rating = models.IntegerField(null=True, blank=True)  # Điểm đánh giá (1-5), null nếu là reply
    content = models.TextField()  # Nội dung review / bình luận
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PUBLISHED)
    edited_at = models.DateTimeField(null=True, blank=True)  # Thời điểm người dùng sửa lần cuối
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'review'
        ordering = ['-created_at']
