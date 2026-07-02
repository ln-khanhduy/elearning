from django.utils import timezone
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

from apps.users.repositories import user_repository


# Các role quản trị không được phép khóa/mở khóa qua User Management
ADMIN_ROLES = {
"SUPERADMIN",
"COURSE_ADMIN",
"INSTRUCTOR_MANAGER",
"FINANCE_ADMIN",
"USER_MANAGER",
}
def _blacklist_user_tokens(user):
    """
    Blacklist tất cả refresh token đang hoạt động của user.
    Điều này buộc user phải đăng nhập lại (hoặc bị logout nếu đang online).
    """
    outstanding_tokens = OutstandingToken.objects.filter(user=user)
    for token in outstanding_tokens:
        try:
            refresh = RefreshToken(token.token)
            refresh.blacklist()
        except Exception:
            pass
def toggle_user_active(user, admin_user, reason=""):
    """
    Khóa hoặc mở khóa tài khoản người dùng.
    - Nếu user đang active (is_active=True) → khóa
    - Nếu user đang locked (is_active=False) → mở khóa
    - Kiểm tra không tự khóa chính mình
    - Kiểm tra không được khóa admin (SUPERADMIN, COURSE_ADMIN, ...)
    - Khi khóa: yêu cầu lý do, blacklist token
    - Khi mở khóa: xóa lý do, không cần lý do

    Trả về (user, message)
    """
    if user.id == admin_user.id:
        raise DRFValidationError({"detail": "Bạn không thể tự khóa tài khoản của mình."})

    # Kiểm tra không được khóa tài khoản quản trị
    if user.role and user.role.code in ADMIN_ROLES:
        raise DRFValidationError({"detail": "Không thể khóa tài khoản quản trị."})

    if user.is_active:
        # Khóa tài khoản
        if not reason or not reason.strip():
            raise DRFValidationError({"detail": "Vui lòng nhập lý do khóa tài khoản."})

        user.is_active = False
        user.account_status_reason = reason.strip()
        user.account_status_changed_at = timezone.now()
        user.account_status_changed_by = admin_user
        user.save(update_fields=[
            "is_active", "account_status_reason",
            "account_status_changed_at", "account_status_changed_by",
        ])

        # Blacklist tất cả refresh token để logout user ngay lập tức
        _blacklist_user_tokens(user)

        message = f"Đã khóa tài khoản {user.email} thành công."
    else:
        # Mở khóa tài khoản
        user.is_active = True
        user.account_status_reason = None
        user.account_status_changed_at = timezone.now()
        user.account_status_changed_by = admin_user
        user.save(update_fields=[
            "is_active", "account_status_reason",
            "account_status_changed_at", "account_status_changed_by",
        ])

        message = f"Đã mở khóa tài khoản {user.email} thành công."

    return user, message
def get_managed_users(search=None, role=None, status=None, page=1, page_size=10):
    """
    Lấy danh sách người dùng có thể quản lý (Student, Instructor) có phân trang.
    - search: tìm kiếm theo họ tên hoặc email
    - role: 'student' | 'instructor' | None (all)
    - status: 'active' | 'locked' | None (all)
    - page: trang hiện tại
    - page_size: số lượng item mỗi trang
    Trả về dict gồm: results, total, page, page_size, total_pages
    """
    return user_repository.get_managed_users(search, role, status, page, page_size)
