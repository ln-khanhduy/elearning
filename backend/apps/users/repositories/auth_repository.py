from django.contrib.auth import get_user_model

from apps.users.models import Role

User = get_user_model()


class AuthRepository:
    """Repository quản lý truy vấn dữ liệu User và Role - tách biệt ORM khỏi business logic."""

    @staticmethod
    def get_user_by_email(email: str):
        """Lấy user theo email, không phân biệt hoa thường. Trả về None nếu không tìm thấy."""
        return User.objects.filter(email__iexact=email).first()

    @staticmethod
    def create_user(
        email: str,
        password: str,
        first_name: str = '',
        last_name: str = '',
        role: Role = None,
    ):
        """Tạo user mới với thông tin cơ bản và role, sử dụng create_user để hash password tự động.
        Email được dùng làm định danh duy nhất."""
        return User.objects.create_user(
            username=email,  # Giữ username=email để tương thích với AbstractUser
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
        )

    @staticmethod
    def get_or_create_role(code: str, name: str):
        """Lấy role theo code hoặc tạo mới nếu chưa tồn tại."""
        role, _ = Role.objects.get_or_create(code=code, defaults={'name': name})
        return role
