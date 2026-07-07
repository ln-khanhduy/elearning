"""
AdminUserService - Service quản lý người dùng tập trung.
Dựa vào role của admin đang đăng nhập để xác định:
- SUPERADMIN: thấy tất cả (admin, instructor, student)
- USER_MANAGER: chỉ thấy student
- INSTRUCTOR_MANAGER: chỉ thấy instructor
"""

from django.core.paginator import Paginator, EmptyPage
from django.db.models import Q
from apps.users.models import User


__ALL_ROLES__ = "__ALL_ROLES__"
__NO_ACCESS__ = "__NO_ACCESS__"


def get_user_list(requesting_user, search=None, role=None, status=None, page=1, page_size=10):
    """
    Lấy danh sách người dùng dựa trên quyền của người đang đăng nhập.
    - SUPERADMIN: thấy tất cả (admin, instructor, student, user_manager...)
    - USER_MANAGER: chỉ thấy student
    - INSTRUCTOR_MANAGER: chỉ thấy instructor
    - COURSE_ADMIN: thấy instructor + student
    """
    role_code = requesting_user.role.code if requesting_user.role else None

    allowed_roles = _get_allowed_role_codes(role_code, role)
    if allowed_roles == __NO_ACCESS__:
        return {"results": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}

    return _query_users(allowed_roles, search, status, page, page_size)


def _get_allowed_role_codes(admin_role_code, requested_role):
    """Xác định danh sách role codes được phép xem dựa trên role của admin."""
    if admin_role_code == "SUPERADMIN":
        if requested_role == "student":
            return ["STUDENT"]
        elif requested_role == "instructor":
            return ["INSTRUCTOR"]
        elif requested_role == "admin":
            return ["SUPERADMIN", "COURSE_ADMIN", "INSTRUCTOR_MANAGER", "USER_MANAGER", "FINANCE_ADMIN"]
        return __ALL_ROLES__
    elif admin_role_code == "USER_MANAGER":
        return ["STUDENT"]
    elif admin_role_code == "INSTRUCTOR_MANAGER":
        return ["INSTRUCTOR"]
    elif admin_role_code == "COURSE_ADMIN":
        return ["INSTRUCTOR", "STUDENT"]
    return __NO_ACCESS__


def _query_users(role_codes, search, status, page, page_size):
    """Query users với role_codes, search và status filter."""
    if role_codes == __ALL_ROLES__:
        qs = User.objects.select_related("role").all()
    else:
        qs = User.objects.select_related("role").filter(role__code__in=role_codes)

    if search:
        qs = qs.filter(
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(email__icontains=search)
        )

    if status == "active":
        qs = qs.filter(is_active=True)
    elif status == "locked":
        qs = qs.filter(is_active=False)

    qs = qs.order_by("-date_joined")
    paginator = Paginator(qs, page_size)
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


def _get_course_admin_users(search=None, status=None, page=1, page_size=10):
    """COURSE_ADMIN: lấy instructor + student."""
    from django.core.paginator import Paginator, EmptyPage
    from django.db.models import Q
    from apps.users.models import User

    qs = User.objects.select_related("role").filter(
        role__code__in=["INSTRUCTOR", "STUDENT"]
    )

    if search:
        qs = qs.filter(
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(email__icontains=search)
        )

    if status == "active":
        qs = qs.filter(is_active=True)
    elif status == "locked":
        qs = qs.filter(is_active=False)

    qs = qs.order_by("-date_joined")
    paginator = Paginator(qs, page_size)
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


def can_manage_user(requesting_user, target_user):
    """
    Kiểm tra requesting_user có quyền quản lý target_user không.
    SUPERADMIN: quản lý tất cả
    USER_MANAGER: chỉ student
    INSTRUCTOR_MANAGER: chỉ instructor
    """
    role_code = requesting_user.role.code if requesting_user.role else None
    target_role_code = target_user.role.code if target_user.role else None

    if role_code == "SUPERADMIN":
        return True
    if role_code == "USER_MANAGER" and target_role_code == "STUDENT":
        return True
    if role_code == "INSTRUCTOR_MANAGER" and target_role_code == "INSTRUCTOR":
        return True
    if role_code == "COURSE_ADMIN" and target_role_code in ("INSTRUCTOR", "STUDENT"):
        return True
    return False


def can_assign_role(requesting_user):
    """Chỉ SUPERADMIN mới được gán role."""
    return requesting_user.role and requesting_user.role.code == "SUPERADMIN"