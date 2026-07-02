from django.core.paginator import Paginator, EmptyPage
from rest_framework.exceptions import ValidationError as DRFValidationError

from apps.users.repositories import instructor_manager_repository
from apps.users.services import user_management_service


def get_instructors(search=None, status=None, page=1, page_size=10):
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
    if not reason or not reason.strip():
        raise DRFValidationError({"detail": "Vui lòng nhập lý do khóa tài khoản."})

    user = instructor_manager_repository.get_instructor_by_id(user_id)
    user, message = user_management_service.toggle_user_active(user, admin_user, reason)
    return user, message


def unlock_instructor(user_id, admin_user):
    user = instructor_manager_repository.get_instructor_by_id(user_id)
    user, message = user_management_service.toggle_user_active(user, admin_user)
    return user, message