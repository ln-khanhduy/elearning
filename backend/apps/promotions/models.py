from django.conf import settings
from django.db import models


class Coupon(models.Model):
    """
    Mã giảm giá - dùng để giảm giá khóa học khi thanh toán.
    Hỗ trợ giảm theo phần trăm hoặc số tiền cố định.
    """
    class DiscountType(models.TextChoices):
        PERCENTAGE = 'PERCENTAGE', 'Phần trăm'
        FIXED = 'FIXED', 'Số tiền cố định'

    code = models.CharField(max_length=50, unique=True)            # Mã giảm giá (VD: "SALE20")
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices, default=DiscountType.PERCENTAGE)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)  # Giá trị giảm (20 = 20%, hoặc 100000 = 100k VNĐ)
    max_usage_count = models.IntegerField(default=0)               # 0 = không giới hạn
    used_count = models.IntegerField(default=0)                    # Số lần đã dùng
    max_uses_per_user = models.IntegerField(default=1)             # Mỗi user dùng tối đa bao nhiêu lần
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Giá trị đơn tối thiểu
    applicable_courses = models.ManyToManyField(
        'courses.Course', blank=True, related_name='coupons'
    )  # Khóa học áp dụng (để trống = áp dụng tất cả)
    start_date = models.DateTimeField()                            # Ngày bắt đầu hiệu lực
    end_date = models.DateTimeField()                              # Ngày kết thúc
    is_active = models.BooleanField(default=True)                  # Kích hoạt / vô hiệu
    description = models.TextField(null=True, blank=True)          # Mô tả mã giảm giá
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='created_coupons'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'coupon'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active', 'start_date', 'end_date']),
        ]

    def __str__(self):
        return f"{self.code} ({self.get_discount_type_display()}: {self.discount_value})"


class CouponUsage(models.Model):
    """
    Lịch sử sử dụng mã giảm giá - tracking ai dùng, khi nào, cho đơn hàng nào.
    """
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name='usages')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='coupon_usages')
    # Liên kết tới payment transaction (sẽ có sau khi thanh toán thành công)
    transaction = models.ForeignKey(
        'payments.PaymentTransaction', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='coupon_usages'
    )
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)  # Số tiền được giảm
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'coupon_usage'
        ordering = ['-used_at']
        indexes = [
            models.Index(fields=['coupon', 'user']),
        ]

    def __str__(self):
        return f"{self.coupon.code} - {self.user.email} - {self.used_at}"