from django.core.paginator import Paginator, EmptyPage
from django.utils import timezone
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

from apps.users.repositories.instructor_manager_repository import InstructorManagerRepository


class InstructorManagerService:
    """Service quản lý giảng viên cho Instructor Manager."""

    @staticmethod
    def get_instructors(search=None, status=None, page=1, page_size=10):
        """
        Lấy danh sách giảng viên có phân trang.
        - search: tìm kiếm theo họ tên hoặc email
        - status: 'active' | 'locked' | None (all)
        - page: trang hiện tại
        - page_size: số lượng item mỗi trang
        Trả về dict gồm: results, total, page, page_size, total_pages
        """
        queryset = InstructorManagerRepository.get_instructors(search, status)

        paginator = Paginator(queryset, page_size)
        total = paginator.count
        total_pages = paginator.num_pages

        try:
            page_obj = paginator.page(page)
        except EmptyPage:
            page_obj = paginator.page(paginator.num_pages)

        return {
            "results": list(page_obj.object_list),
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    @staticmethod
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

    @staticmethod
    def lock_instructor(user_id, admin_user, reason=""):
        """
        Khóa tài khoản giảng viên.
        - Kiểm tra không tự khóa chính mình
        - Kiểm tra user có role Instructor
        - Yêu cầu phải có lý do khóa
        - Lưu lý do, thời gian khóa, người khóa
        - Blacklist tất cả refresh token của user để logout ngay lập tức
        """
        if not reason or not reason.strip():
            raise DRFValidationError({"detail": "Vui lòng nhập lý do khóa tài khoản."})

        user = InstructorManagerRepository.get_instructor_by_id(user_id)

        # Không cho tự khóa chính mình
        if user.id == admin_user.id:
            raise DRFValidationError({"detail": "Bạn không thể tự khóa tài khoản của mình."})

        user.is_active = False
        user.account_status_reason = reason.strip()
        user.account_status_changed_at = timezone.now()
        user.account_status_changed_by = admin_user
        user.save(update_fields=["is_active", "account_status_reason", "account_status_changed_at", "account_status_changed_by"])

        # Blacklist tất cả refresh token để logout user ngay lập tức
        InstructorManagerService._blacklist_user_tokens(user)

        message = f"Đã khóa tài khoản giảng viên {user.email} thành công."
        return user, message

    @staticmethod
    def unlock_instructor(user_id, admin_user):
        """
        Mở khóa tài khoản giảng viên.
        - Không cần lý do
        - Lưu thời gian mở khóa, người mở khóa
        - Xóa lý do khóa cũ
        """
        user = InstructorManagerRepository.get_instructor_by_id(user_id)

        # Không cho tự mở khóa chính mình
        if user.id == admin_user.id:
            raise DRFValidationError({"detail": "Bạn không thể tự mở khóa tài khoản của mình."})

        user.is_active = True
        user.account_status_reason = None
        user.account_status_changed_at = timezone.now()
        user.account_status_changed_by = admin_user
        user.save(update_fields=["is_active", "account_status_reason", "account_status_changed_at", "account_status_changed_by"])

        message = f"Đã mở khóa tài khoản giảng viên {user.email} thành công."
        return user, message
