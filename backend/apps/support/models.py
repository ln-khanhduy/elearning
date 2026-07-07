import uuid6
from django.conf import settings
from django.db import models


class SupportRequest(models.Model):
    """
    Yêu cầu hỗ trợ từ người dùng (học viên, giảng viên).
    Các loại: hoàn tiền, báo cáo kỹ thuật, khiếu nại.
    Mỗi loại sẽ được xử lý bởi role tương ứng.
    """
    class RequestType(models.TextChoices):
        REFUND = 'REFUND', 'Yêu cầu hoàn tiền'
        TECHNICAL = 'TECHNICAL', 'Báo cáo kỹ thuật'
        COMPLAINT = 'COMPLAINT', 'Khiếu nại'
        OTHER = 'OTHER', 'Khác'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Chờ xử lý'
        PROCESSING = 'PROCESSING', 'Đang xử lý'
        RESOLVED = 'RESOLVED', 'Đã giải quyết'
        REJECTED = 'REJECTED', 'Từ chối'

    id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)
    request_type = models.CharField(max_length=20, choices=RequestType.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_requests')
    title = models.CharField(max_length=200)
    description = models.TextField()
    # Liên kết tới giao dịch (nếu là yêu cầu hoàn tiền)
    transaction = models.ForeignKey('payments.PaymentTransaction', on_delete=models.SET_NULL, null=True, blank=True, related_name='support_requests')
    # Người xử lý
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_requests')
    resolution_note = models.TextField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'support_request'
        ordering = ['-created_at']