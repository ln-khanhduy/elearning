from django.core.paginator import Paginator, EmptyPage
from django.db.models import Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from apps.users.models import User, Role


def get_all_users():
    """Lấy tất cả người dùng kèm vai trò, sắp xếp theo thời gian đăng ký mới nhất."""
    return User.objects.select_related("role").all().order_by("-date_joined")


def get_user_by_id(user_id):
    """Lấy người dùng theo ID kèm vai trò, trả về 404 nếu không tìm thấy."""
    return get_object_or_404(User.objects.select_related("role"), id=user_id)


def get_user_by_email(email):
    """Lấy người dùng theo email (không phân biệt hoa thường), trả về None nếu không tìm thấy."""
    return User.objects.filter(email__iexact=email).first()


def create_user(email, password, first_name='', last_name='', role=None, phone=''):
    """Tạo mới một người dùng với username mặc định là email."""
    return User.objects.create_user(
        username=email, email=email, password=password,
        first_name=first_name, last_name=last_name, role=role, phone=phone,
    )


def get_role_by_id(role_id):
    """Lấy vai trò theo ID, trả về 404 nếu không tìm thấy."""
    return get_object_or_404(Role, id=role_id)


def get_role_by_code(code):
    """Lấy vai trò theo mã code, trả về 404 nếu không tìm thấy."""
    return get_object_or_404(Role, code=code)


def update_last_login(user):
    """Cập nhật thời điểm đăng nhập cuối cùng của người dùng."""
    user.last_login = timezone.now()
    user.save(update_fields=["last_login"])


def get_users_by_role(role_code):
    """Lấy tất cả user theo role code."""
    return User.objects.filter(role__code=role_code).select_related('role').all()


def get_managed_users(search=None, role=None, status=None, page=1, page_size=10):
    """Lấy danh sách người dùng được quản lý (STUDENT/INSTRUCTOR) có lọc, tìm kiếm và phân trang.

    - search: tìm kiếm theo first_name, last_name hoặc email.
    - role: lọc theo role STUDENT hoặc INSTRUCTOR.
    - status: 'active' hoặc 'locked'.
    - Trả về dict chứa: results, total, page, page_size, total_pages.
    """
    qs = User.objects.select_related("role").filter(role__code__in=["STUDENT", "INSTRUCTOR"])
    if role and role.upper() in ["STUDENT", "INSTRUCTOR"]:
        qs = qs.filter(role__code=role.upper())
    if search:
        qs = qs.filter(Q(first_name__icontains=search) | Q(last_name__icontains=search) | Q(email__icontains=search))
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
    return {"results": list(page_obj.object_list), "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}