from django.db import models
from uuid6 import uuid7

class PaymentTransaction(models.Model):
    # Giao dich thanh toan cho mot lan mua khoa hoc.
    # Co che 7 ngay giu tien: hold_until = paid_at + 7 ngay
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),                    # Da tao lenh, cho cong thanh toan phan hoi
        ('HOLD', 'Hold'),                          # Da thanh toan, dang giu 7 ngay
        ('PAID', 'Paid'),                          # Thanh toan thanh cong
        ('FAILED', 'Failed'),                      # Thanh toan that bai
        ('REFUND_REQUESTED', 'Refund requested'),  # Hoc vien da yeu cau hoan tien
        ('REFUND_REJECTED', 'Refund rejected'),    # Finance Admin tu choi hoan tien
        ('REFUND_APPROVED', 'Refund approved'),    # Finance Admin da duyet hoan tien
        ('REFUNDED', 'Refunded '),                 # Da hoan tien xong
    )

    PROVIDER_CHOICES = (
    ('MOMO', 'MoMo'),
    ('STRIPE', 'Stripe'),
    )
    # ID giao dich thanh toan
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)  # ID tự tăng cho mỗi giao dịch
    # Hoc vien mua
    student = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='payment_transactions')
    # Khoa hoc duoc mua
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='payment_transactions')
    # Ma GD cua cong (doi soat) - nullable vì PENDING transaction chưa có provider ID
    provider_transaction_id = models.CharField(max_length=100, unique=True, null=True, blank=True) 

    # Ten cong tt: 'vnpay', 'stripe', 'momo'
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES) 
    # So tien hoc vien phai tra thuc te
    gross_amount = models.DecimalField(max_digits=12, decimal_places=2)
    # Phi cong tt (VNPay, Stripe,...)
    payment_fee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00) 
    # Thue VAT / khau tru tai nguon
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)  
    # gross - payment_fee - tax = so tien thuc te thu ve, dung de chia cho nen tang va giang vien
    net_amount = models.DecimalField(max_digits=12, decimal_places=2)  
    # Phan % nen tang giu lai
    platform_fee_amount = models.DecimalField(max_digits=12, decimal_places=2) 
    # Phan chuyen cho giang vien 
    instructor_share_amount = models.DecimalField(max_digits=12, decimal_places=2) 
    # Trang thai giao dich
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    # thoi gian bat dau giu tien (sau khi thanh toan thanh cong, chuyen sang trang thai HOLD)
    hold_time = models.DateTimeField(null=True, blank=True)  
    # thoi gian sau 7 ngay het han khieu nai hoan tien
    paid_at = models.DateTimeField(null=True, blank=True)  
    # Tien da hoan ve tai khoan hoc vien
    refunded_at = models.DateTimeField(null=True, blank=True)  
    # Ly do hoan tien neu co
    refund_reason = models.TextField(null=True, blank=True)  
    # Thoi diem hoc vien yeu cau hoan tien
    refund_requested_at = models.DateTimeField(null=True, blank=True)
    # Dich danh ai la nguoi xu ly hoan tien (Finance Admin) 
    refund_reviewed_by = models.ForeignKey('users.User',on_delete=models.SET_NULL,null=True,blank=True,
        related_name='reviewed_refunds',
    )
    # Thoi diem admin xu ly hoan tien
    refund_reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payment_transaction'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),                  # Loc theo trang thai + moi nhat
            models.Index(fields=['student', 'status', 'created_at']),   # Lich su GD cua hoc vien
            models.Index(fields=['hold_time']),                            # Tac vu dinh ky: tim GD het hold
        ]