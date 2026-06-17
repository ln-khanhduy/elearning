from django.core.paginator import Paginator, EmptyPage
from rest_framework.exceptions import ValidationError as DRFValidationError

from apps.users.repositories.instructor_manager_repository import InstructorManagerRepository
from apps.users.services.user_management_service import UserManagementService


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
    def lock_instructor(user_id, admin_user, reason=""):
        """
        Khóa tài khoản giảng viên.
        Sử dụng service dùng chung UserManagementService.toggle_user_active().
        - Kiểm tra không tự khóa chính mình
        - Kiểm tra user có role Instructor
        - Yêu cầu phải có lý do khóa
        """
        if not reason or not reason.strip():
            raise DRFValidationError({"detail": "Vui lòng nhập lý do khóa tài khoản."})

        user = InstructorManagerRepository.get_instructor_by_id(user_id)

        # Sử dụng service dùng chung để toggle active
        # Vì user đang active, toggle sẽ khóa
        user, message = UserManagementService.toggle_user_active(user, admin_user, reason)

        return user, message

    @staticmethod
    def unlock_instructor(user_id, admin_user):
        """
        Mở khóa tài khoản giảng viên.
        Sử dụng service dùng chung UserManagementService.toggle_user_active().
        - Không cần lý do
        """
        user = InstructorManagerRepository.get_instructor_by_id(user_id)

        # Sử dụng service dùng chung để toggle active
        # Vì user đang locked, toggle sẽ mở khóa
        user, message = UserManagementService.toggle_user_active(user, admin_user)

        return user, message
