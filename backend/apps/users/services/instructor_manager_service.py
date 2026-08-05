from django.core.paginator import Paginator, EmptyPage
from rest_framework.exceptions import ValidationError as DRFValidationError

from apps.users.repositories import instructor_manager_repository
from apps.users.services import user_management_service


def get_instructors(search=None, status=None, page=1, page_size=10):
    """Lấy danh sách giảng viên có lọc, tìm kiếm và phân trang.

    - search: tìm kiếm theo tên hoặc email.
    - status: lọc theo trạng thái tài khoản.
    - Trả về dict chứa: results, total, page, page_size, total_pages.
    """
    queryset = instructor_manager_repository.get_instructors(search, status)

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


def lock_instructor(user_id, admin_user, reason=""):
    """Khóa tài khoản giảng viên.

    - Bắt buộc nhập lý do khóa tài khoản, ngược lại báo lỗi ValidationError.
    - Thực hiện khóa thông qua user_management_service.
    """
    if not reason or not reason.strip():
        raise DRFValidationError({"detail": "Vui lòng nhập lý do khóa tài khoản."})

    user = instructor_manager_repository.get_instructor_by_id(user_id)
    user, message = user_management_service.toggle_user_active(user, admin_user, reason)
    return user, message


def unlock_instructor(user_id, admin_user):
    """Mở khóa tài khoản giảng viên.

    - Thực hiện mở khóa thông qua user_management_service.
    """
    user = instructor_manager_repository.get_instructor_by_id(user_id)
    user, message = user_management_service.toggle_user_active(user, admin_user)
    return user, message