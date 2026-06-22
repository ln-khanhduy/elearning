from django.core.paginator import Paginator, EmptyPage
from django.db.models import Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from apps.users.models import User, Role


class UserRepository:
    """Repository quản lý người dùng chung - danh sách, chi tiết, role, google account."""

    @staticmethod
    def get_all_users():
        """Lấy danh sách tất cả người dùng, kèm thông tin role, sắp xếp theo ngày tham gia mới nhất."""
        return User.objects.select_related("role").all().order_by("-date_joined")

    @staticmethod
    def get_user_by_id(user_id):
        """Lấy thông tin chi tiết của một người dùng theo ID, kèm thông tin role. Trả về 404 nếu không tìm thấy."""
        return get_object_or_404(User.objects.select_related("role"), id=user_id)

    @staticmethod
    def get_user_by_email(email):
        """Lấy user theo email, không phân biệt hoa thường. Trả về None nếu không tìm thấy."""
        return User.objects.filter(email__iexact=email).first()

    @staticmethod
    def create_user(email, password, first_name='', last_name='', role=None, phone=''):
        """Tạo user mới với thông tin cơ bản và role, sử dụng create_user để hash password tự động."""
        return User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            phone=phone,
        )

    @staticmethod
    def get_role_by_id(role_id):
        """Lấy thông tin role theo ID. Trả về 404 nếu không tìm thấy."""
        return get_object_or_404(Role, id=role_id)

    @staticmethod
    def get_role_by_code(code):
        """Lấy thông tin role theo mã code (VD: 'STUDENT', 'INSTRUCTOR'). Trả về 404 nếu không tìm thấy."""
        return get_object_or_404(Role, code=code)

    @staticmethod
    def get_user_by_google_email(google_email):
        """Lấy user theo google_email. Trả về None nếu không tìm thấy."""
        return User.objects.filter(google_email=google_email.lower()).first()

    @staticmethod
    def link_google_account(user, google_email):
        """Liên kết Google Account với user. Lưu google_email vào user."""
        user.google_email = google_email
        user.save(update_fields=["google_email"])
        return user

    @staticmethod
    def update_last_login(user):
        """Cập nhật thời gian đăng nhập cuối cùng của user."""
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

    @staticmethod
    def get_managed_users(search=None, role=None, status=None, page=1, page_size=10):
        """
        Lấy danh sách người dùng có thể quản lý (Student, Instructor) có phân trang.
        Chỉ trả về user có role STUDENT hoặc INSTRUCTOR.
        - search: tìm kiếm theo họ tên hoặc email
        - role: 'student' | 'instructor' | None (all)
        - status: 'active' | 'locked' | None (all)
        - page: trang hiện tại
        - page_size: số lượng item mỗi trang
        Trả về dict gồm: results, total, page, page_size, total_pages
        """
        # Chỉ lấy user có role STUDENT hoặc INSTRUCTOR
        qs = User.objects.select_related("role").filter(
            role__code__in=["STUDENT", "INSTRUCTOR"]
        )

        # Lọc theo role cụ thể
        if role and role.upper() in ["STUDENT", "INSTRUCTOR"]:
            qs = qs.filter(role__code=role.upper())

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
        qs = qs.order_by("-date_joined")

        # Phân trang
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
