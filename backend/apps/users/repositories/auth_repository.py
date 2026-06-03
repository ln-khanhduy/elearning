from django.contrib.auth import get_user_model

from apps.users.models import Role

User = get_user_model()


# Repository quản lý truy vấn với User/Role
# Tách phần truy cập dữ liệu khỏi business logic
class AuthRepository:
    @staticmethod
    def get_user_by_email(email: str):
        # Lấy user theo email không phân biệt hoa thường
        return User.objects.filter(email__iexact=email).first()

    @staticmethod
    def get_user_by_username(username: str):
        # Lấy user theo username không phân biệt hoa thường
        return User.objects.filter(username__iexact=username).first()

    @staticmethod
    def create_user(
        username: str,
        email: str,
        password: str,
        first_name: str = '',
        last_name: str = '',
        role: Role = None,
    ):
        # Tạo user mới với thông tin cơ bản và role
        return User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
        )

    @staticmethod
    def get_or_create_role(code: str, name: str):
        # Lấy role theo code hoặc tạo mới nếu chưa tồn tại
        role, _ = Role.objects.get_or_create(code=code, defaults={'name': name})
        return role
