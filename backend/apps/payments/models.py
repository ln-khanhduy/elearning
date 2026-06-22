from django.conf import settings
from django.db import models


class PaymentTransaction(models.Model):
    """
    Giao dịch thanh toán - ghi nhận mỗi lần học viên thanh toán khóa học.
    """
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        HOLD = 'HOLD', 'Hold'
        PAID = 'PAID', 'Paid'
        FAILED = 'FAILED', 'Failed'
        REFUND_REQUESTED = 'REFUND_REQUESTED', 'Refund requested'
        REFUND_REJECTED = 'REFUND_REJECTED', 'Refund rejected'
        REFUND_APPROVED = 'REFUND_APPROVED', 'Refund approved'
        REFUNDED = 'REFUNDED', 'Refunded'

    class Provider(models.TextChoices):
        MOMO = 'MOMO', 'MoMo'
        STRIPE = 'STRIPE', 'Stripe'

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='payments')
    # Ten cong tt: 'stripe'
    provider = models.CharField(max_length=20, choices=Provider.choices)
    provider_transaction_id = models.CharField(max_length=255, null=True, blank=True)  # ID từ provider
    # So tien hoc vien phai tra thuc te
    gross_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_fee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    platform_fee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    instructor_share_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # Trang thai giao dich
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    # thoi gian bat dau giu tien (sau khi thanh toan thanh cong, chuyen sang trang thai HOLD)
    hold_time = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    # Thong tin hoan tien
    refund_requested_at = models.DateTimeField(null=True, blank=True)
    refund_reason = models.TextField(null=True, blank=True)
    refund_reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='refund_reviews')
    refund_reviewed_at = models.DateTimeField(null=True, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payment_transaction'
        ordering = ['-created_at']