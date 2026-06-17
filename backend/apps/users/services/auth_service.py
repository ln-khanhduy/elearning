from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.repositories.user_repository import UserRepository


class AuthService:
    """Service xử lý xác thực người dùng - tạo token JWT, blacklist refresh token, cập nhật last_login."""

    @staticmethod
    def generate_tokens_for_user(user):
        """Tạo cặp token JWT (access + refresh) cho người dùng sau khi đăng nhập thành công."""
        refresh = RefreshToken.for_user(user)
        return {"refresh": str(refresh), "access": str(refresh.access_token)}

    @staticmethod
    def update_last_login(user):
        """Cập nhật thời gian đăng nhập cuối cùng cho user. Dùng chung cho mọi luồng đăng nhập."""
        UserRepository.update_last_login(user)

    @staticmethod
    def blacklist_refresh_token(refresh_token):
        """Đưa refresh token vào blacklist để vô hiệu hóa khi người dùng đăng xuất."""
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except Exception:
                pass
