import uuid6

from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.Model):
    """
    Vai trò người dùng - phân quyền chi tiết theo từng module.
    Mỗi user có 1 role duy nhất.
    VD: SUPERADMIN, COURSE_ADMIN, INSTRUCTOR_MANAGER, USER_MANAGER, FINANCE_ADMIN, INSTRUCTOR, STUDENT
    """
    code = models.CharField(max_length=50, unique=True)  # Mã role (VD: "SUPERADMIN")
    name = models.CharField(max_length=100)               # Tên hiển thị (VD: "Super Admin")

    class Meta:
        db_table = 'role'

    def __str__(self):
        return self.name


class RolePermission(models.Model):
    """
    Permission chi tiết cho từng role.
    Mỗi role có thể có nhiều permission.
    VD code: "course.course.create", "user.user.lock"
    """
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='permissions')
    code = models.CharField(max_length=100)  # Mã permission (VD: "course.course.create")
    name = models.CharField(max_length=255)  # Tên hiển thị (VD: "Tạo khóa học")

    class Meta:
        db_table = 'role_permission'
        unique_together = ('role', 'code')

    def __str__(self):
        return f"{self.role.code}: {self.code}"



class User(AbstractUser):
    """
    Model người dùng tùy chỉnh - kế thừa AbstractUser.
    Sử dụng email làm username (USERNAME_FIELD = 'email').
    """

    id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    email = models.EmailField(unique=True)                # Email đăng nhập
    phone = models.CharField(max_length=15, null=True, blank=True)  # Số điện thoại
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)  # Ảnh đại diện
    # Liên kết Google Account
    google_email = models.EmailField(null=True, blank=True, unique=True)
    account_status_reason = models.TextField(null=True, blank=True)  # Lý do khóa
    account_status_changed_at = models.DateTimeField(null=True, blank=True)  # Thời gian khóa/mở
    account_status_changed_by = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True
    )  # Ai khóa/mở

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # Mặc định email + password

    class Meta:
        db_table = 'user_account'

    @property
    def avatar_url(self):
        if self.avatar:
            return self.avatar.url
        return None


class InstructorProfile(models.Model):
    """
    Hồ sơ giảng viên - lưu thông tin đăng ký và xét duyệt.
    Khi user đăng ký làm giảng viên, tạo một InstructorProfile.
    Sau khi duyệt, tạo User mới và liên kết với profile này.
    """
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='instructor_profile')
    name = models.CharField(max_length=100)               # Họ tên đầy đủ
    email = models.EmailField(unique=True)                 # Email liên hệ
    bio = models.TextField(null=True, blank=True)          # Giới thiệu bản thân
    portfolio_link = models.URLField(null=True, blank=True)  # Link portfolio
    cv_file = models.FileField(upload_to='instructor_cvs/', null=True, blank=True)  # File CV
    contact_phone = models.CharField(max_length=15, null=True, blank=True)  # Số điện thoại
    # Thông tin ngân hàng
    bank_name = models.CharField(max_length=100, null=True, blank=True)
    bank_account_number = models.CharField(max_length=50, null=True, blank=True)
    bank_account_name = models.CharField(max_length=100, null=True, blank=True)
    is_terms_accepted = models.BooleanField(default=False)  # Đồng ý điều khoản
    # Trạng thái duyệt
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    rejection_reason = models.TextField(null=True, blank=True)  # Lý do từ chối
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_applications')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'instructor_profile'


class InstructorCertificate(models.Model):
    """
    Chứng chỉ giảng viên - file chứng minh năng lực.
    Mỗi giảng viên có thể có nhiều chứng chỉ.
    """
    profile = models.ForeignKey(InstructorProfile, on_delete=models.CASCADE, related_name='certificates')
    title = models.CharField(max_length=200)               # Tên chứng chỉ
    file = models.FileField(upload_to='instructor_certificates/')  # File chứng chỉ
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'instructor_certificate'
