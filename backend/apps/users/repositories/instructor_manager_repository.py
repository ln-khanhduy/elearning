from django.db.models import Q
from django.shortcuts import get_object_or_404
from apps.users.models import User, Role
def get_instructor_role():
    """Lấy role Instructor."""
    return get_object_or_404(Role, code="INSTRUCTOR")
def get_instructors(search=None, status=None):
    """
    Lấy danh sách user có role Instructor.
    - search: tìm kiếm theo full_name hoặc email
    - status: 'active' | 'locked' | None (all)
    """
    instructor_role = get_instructor_role()
    qs = User.objects.select_related("role").filter(role=instructor_role)

    # Tìm kiếm theo họ tên hoặc email
    if search:
        qs = qs.filter(
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(email__icontains=search)
        )

    # Lọc theo trạng thái is_active
    if status == "active":
        qs = qs.filter(is_active=True)
    elif status == "locked":
        qs = qs.filter(is_active=False)

    # Sắp xếp theo ngày tham gia mới nhất
    return qs.order_by("-date_joined")
def get_instructor_by_id(user_id):
    """Lấy user có role Instructor theo ID."""
    instructor_role = get_instructor_role()
    return get_object_or_404(
        User.objects.select_related("role"),
        id=user_id,
        role=instructor_role,
    )
