import uuid6
from django.conf import settings
from django.db import models


class PaymentTransaction(models.Model):
    """
    Giao dịch thanh toán - ghi nhận mỗi lần học viên thanh toán khóa học.
    Là nguồn dữ liệu chính (source of truth) cho tất cả thông tin về thanh toán, hoàn tiền.
    """
    # Mã giao dịch (UUID7 tự sinh, tăng dần theo thời gian)
    id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)

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
        STRIPE = 'STRIPE', 'Stripe'

    # Học viên thực hiện thanh toán
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    # Khóa học được thanh toán
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='payments')
    # Cổng thanh toán: STRIPE, ...
    provider = models.CharField(max_length=20, choices=Provider.choices)
    # ID giao dịch từ phía cổng thanh toán (Stripe PaymentIntent ID)
    provider_transaction_id = models.CharField(max_length=255, null=True, blank=True)
    # Tổng số tiền học viên phải trả (trước khi tính phí)
    gross_amount = models.DecimalField(max_digits=12, decimal_places=2)
    # Phí xử lý thanh toán của cổng thanh toán (Stripe fee)
    payment_fee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # Thuế (hiện tại chưa áp dụng, để dành cho tương lai)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # Số tiền thực nhận sau khi trừ phí và thuế: gross - payment_fee - tax
    net_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # Phí nền tảng (platform) - phần trăm của net_amount
    platform_fee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # Phần doanh thu của giảng viên sau khi trừ platform_fee: net - platform_fee
    instructor_share_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # Trạng thái giao dịch: PENDING -> HOLD -> PAID | FAILED, hoặc REFUND_REQUESTED -> REFUND_APPROVED/REJECTED -> REFUNDED
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    # Thời điểm bắt đầu giữ tiền (sau thanh toán thành công, chuyển HOLD); hết hold_time thì giải ngân cho instructor
    hold_time = models.DateTimeField(null=True, blank=True)
    # Thời điểm học viên thanh toán thành công (chuyển từ PENDING -> HOLD)
    paid_at = models.DateTimeField(null=True, blank=True)
    # ===== Thông tin hoàn tiền (refund) - source of truth duy nhất =====
    # Thời điểm học viên yêu cầu hoàn tiền
    refund_requested_at = models.DateTimeField(null=True, blank=True)
    # Lý do học viên yêu cầu hoàn tiền
    refund_reason = models.TextField(null=True, blank=True)
    # Admin/Finance xét duyệt yêu cầu hoàn tiền
    refund_reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='refund_reviews')
    # Thời điểm xét duyệt hoàn tiền
    refund_reviewed_at = models.DateTimeField(null=True, blank=True)
    # Thời điểm hoàn tiền thành công (chuyển status -> REFUNDED)
    refunded_at = models.DateTimeField(null=True, blank=True)
    # Thời điểm tạo giao dịch
    created_at = models.DateTimeField(auto_now_add=True)
    # Thời điểm cập nhật giao dịch gần nhất
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payment'
        ordering = ['-created_at']