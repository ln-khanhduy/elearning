from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser, Group
from uuid6 import uuid7
class User(AbstractUser):
    """
    Tài khoản người dùng mở rộng từ AbstractUser của Django.
    Hệ thống phân quyền bằng Django Group và Permission (RBAC).
    """
    ACCOUNT_STATUS_CHOICES = (
        ('ACTIVE', 'Active'),              # Hoạt động bình thường
        ('SUSPENDED', 'Suspended'),        # Ngừng tạm thời (vẫn có thể khôi phục)
        ('LOCKED', 'Locked'),              # Bị khóa vĩnh viễn (vi phạm)
    )
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)  # ID tự tăng cho mỗi user
    # Ảnh đại diện, lưu vào thư mục avatars/
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    # Số điện thoại liên hệ (tuỳ chọn)
    phone = models.CharField(max_length=15, null=True, blank=True)
    # Trạng thái tài khoản (ACTIVE / SUSPENDED / LOCKED)
    account_status = models.CharField(max_length=20, choices=ACCOUNT_STATUS_CHOICES, default='ACTIVE')
    # Thời điểm thay đổi trạng thái cuối cùng
    account_status_changed_at = models.DateTimeField(null=True, blank=True)
    # Lý do thay đổi trạng thái (khóa, tạm ngừng,....)
    account_status_reason = models.TextField(null=True, blank=True)
    # Admin nào đã thay đổi trạng thái tài khoản này (FK tới chính bảng User)
    account_status_changed_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='changed_user_statuses',
    )
    #  M2M groups để đặt tên bảng nối rõ ràng
    role = models.ForeignKey(
        Group,
        on_delete=models.PROTECT,
        blank=True,
        related_name='role_users'
    )

    class Meta:
        db_table = 'user_account'
        indexes = [
            models.Index(fields=['account_status']), # Lọc nhanh tài khoản theo trạng thái
            models.Index(fields=['role']),    
        ]

class InstructorCertificate(models.Model):
    """
    Chứng chỉ / bằng cấp của giảng viên.
    Một giảng viên có thể upload nhiều file chứng chỉ.
    """
    # Liên kết tới hồ sơ giảng viên tương ứng
    instructor_profile = models.ForeignKey(
        'users.InstructorProfile',
        on_delete=models.CASCADE,
        related_name='certificates'
    )
    # Tên chứng chỉ (VD: "Bằng Thạc sĩ CNTT")
    title = models.CharField(max_length=255)  
    # File chứng chỉ (PDF, ảnh bằng cấp, chứng nhận chuyên môn, v.v.)
    file = models.FileField(upload_to='instructor_certificates/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = 'instructor_certificate'
        ordering = ['-uploaded_at']

class InstructorProfile(models.Model):
    """
    Hồ sơ đăng ký trở thành giảng viên.
    Một User  có đúng 1 InstructorProfile.
    """
    # Liên kết 1-1 tới tài khoản user tương ứng
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='instructor_profile')

    # --- Thông tin chuyên môn ---
    # Giới thiệu bản thân hiển thị trên trang profile công khai
    bio = models.TextField(null=True, blank=True)
    # Link portfolio / GitHub / LinkedIn cá nhân
    portfolio_link = models.URLField(null=True, blank=True)
    # File CV / hồ sơ năng lực dạng PDF
    cv_file = models.FileField(upload_to='instructor_cvs/')
    # SĐT liên hệ riêng cho giảng viên (có thể khác SĐT tài khoản)
    contact_phone = models.CharField(max_length=15, null=True, blank=True)

    # --- Thông tin ngân hàng để Finance Admin chuyển tiền ---
    bank_name = models.CharField(max_length=100)           # Tên ngân hàng (VD: Vietcombank)
    bank_account_number = models.CharField(max_length=50)  # Số tài khoản
    bank_account_name = models.CharField(max_length=100)   # Tên chủ tài khoản (phải khớp ngân hàng)

    # --- Quy trình phê duyệt ---
    # Giảng viên đã đọc và đồng ý điều khoản hợp tác chưa (bắt buộc trước khi nộp)
    is_terms_accepted = models.BooleanField(default=False)
    # Thời điểm nộp hồ sơ (tự động ghi khi tạo)
    applied_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=10,
        choices=(('PENDING', 'Chờ duyệt'), ('APPROVED', 'Đã duyệt'), ('REJECTED', 'Từ chối')),
        default='PENDING'
    )
    # Lý do từ chối - bắt buộc điền khi status = REJECTED
    rejection_reason = models.TextField(null=True, blank=True)
    # Admin nào đã duyệt / từ chối hồ sơ này
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_instructor_profiles',
    )
    # Thời điểm admin thực hiện duyệt / từ chối
    reviewed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'instructor_profile'
        constraints = [
            models.UniqueConstraint(fields=['user'], name='unique_instructor_profile_user'),
        ]
        indexes = [
            models.Index(fields=['status', 'applied_at']),              # Admin lọc hồ sơ mới chờ duyệt
        ]