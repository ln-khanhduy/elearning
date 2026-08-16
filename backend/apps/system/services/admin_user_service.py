"""
AdminUserService - Service quản lý người dùng tập trung.
Dựa vào role của admin đang đăng nhập để xác định:
- SUPERADMIN: thấy tất cả (admin, instructor, student)
- USER_MANAGER: thấy student + instructor
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
    - USER_MANAGER: thấy student + instructor
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
            return ["SUPERADMIN", "COURSE_ADMIN", "USER_MANAGER"]
        return __ALL_ROLES__
    elif admin_role_code == "USER_MANAGER":
        return ["STUDENT", "INSTRUCTOR"]
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
    USER_MANAGER: student + instructor
    """
    role_code = requesting_user.role.code if requesting_user.role else None
    target_role_code = target_user.role.code if target_user.role else None

    if role_code == "SUPERADMIN":
        return True
    if role_code == "USER_MANAGER" and target_role_code in ("STUDENT", "INSTRUCTOR"):
        return True
    if role_code == "COURSE_ADMIN" and target_role_code in ("INSTRUCTOR", "STUDENT"):
        return True
    return False


def can_assign_role(requesting_user):
    """Chỉ SUPERADMIN mới được gán role."""
    return requesting_user.role and requesting_user.role.code == "SUPERADMIN"


def can_create_user(requesting_user):
    """Chỉ SUPERADMIN mới được tạo tài khoản."""
    return requesting_user.role and requesting_user.role.code == "SUPERADMIN"


def can_reset_password(requesting_user, target_user):
    """Chỉ SUPERADMIN mới được đặt lại mật khẩu người dùng khác."""
    if not (requesting_user.role and requesting_user.role.code == "SUPERADMIN"):
        return False
    if target_user.id == requesting_user.id:
        return False
    return True


def reset_password(requesting_user, target_user, new_password):
    """Đặt lại mật khẩu cho người dùng khác (chỉ SUPERADMIN)."""
    from apps.users.repositories import user_repository

    if not can_reset_password(requesting_user, target_user):
        raise PermissionError("Bạn không có quyền đặt lại mật khẩu.")

    if target_user.role and target_user.role.code == "SUPERADMIN":
        raise ValueError("Không thể đặt lại mật khẩu của tài khoản Super Admin khác.")

    target_user.set_password(new_password)
    target_user.save(update_fields=["password"])
    return target_user


def create_user(requesting_user, full_name, email, password, role_code, phone=""):
    """Tạo tài khoản người dùng mới (chỉ SUPERADMIN).

    - role_code không được là SUPERADMIN.
    - Tự tạo InstructorProfile cho tài khoản INSTRUCTOR để đồng bộ hồ sơ.
    """
    from apps.users.models import InstructorProfile
    from apps.users.repositories import user_repository, auth_repository

    if not can_create_user(requesting_user):
        raise PermissionError("Bạn không có quyền tạo tài khoản.")

    if role_code == "SUPERADMIN":
        raise ValueError("Không thể tạo tài khoản Super Admin qua API.")

    role = user_repository.get_role_by_code(role_code)

    if user_repository.get_user_by_email(email):
        raise ValueError("Email này đã được sử dụng.")

    name_parts = (full_name or "").strip().split(" ", 1)
    first_name = name_parts[0] if name_parts else ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    user = user_repository.create_user(
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        role=role,
        phone=phone or "",
    )

    # Tạo hồ sơ giảng viên cho role INSTRUCTOR để đồng bộ (giống luồng duyệt hồ sơ)
    if role_code == "INSTRUCTOR":
        InstructorProfile.objects.create(
            user=user,
            name=user.get_full_name() or user.email,
            email=user.email,
            bio="",
            status=InstructorProfile.Status.APPROVED,
            is_terms_accepted=True,
        )

    return user
