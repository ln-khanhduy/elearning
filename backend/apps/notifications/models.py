from django.conf import settings
from django.db import models


class Notification(models.Model):
    """
    Thông báo gửi đến người dùng.
    Hỗ trợ gửi qua nhiều kênh (IN_APP, EMAIL).
    """
    class Type(models.TextChoices):
        SYSTEM = 'SYSTEM', 'System'
        PAYMENT = 'PAYMENT', 'Payment'
        COURSE = 'COURSE', 'Course'
        SUPPORT = 'SUPPORT', 'Support'
        ACCOUNT = 'ACCOUNT', 'Account'

    class Channel(models.TextChoices):
        IN_APP = 'IN_APP', 'In app'
        EMAIL = 'EMAIL', 'Email'

    class SendStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SENT = 'SENT', 'Sent'
        FAILED = 'FAILED', 'Failed'

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    body = models.TextField()
    notification_type = models.CharField(max_length=20, choices=Type.choices, default=Type.SYSTEM)
    channel = models.CharField(max_length=20, choices=Channel.choices, default=Channel.IN_APP)
    link = models.URLField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    send_status = models.CharField(max_length=20, choices=SendStatus.choices, default=SendStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notification'
        ordering = ['-created_at']
