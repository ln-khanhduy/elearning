from rest_framework_simplejwt.tokens import RefreshToken


class AuthService:
    """Service xử lý xác thực người dùng - tạo token JWT và blacklist refresh token."""

    @staticmethod
    def generate_tokens_for_user(user):
        """Tạo cặp token JWT (access + refresh) cho người dùng sau khi đăng nhập thành công."""
        refresh = RefreshToken.for_user(user)
        return {"refresh": str(refresh), "access": str(refresh.access_token)}

    @staticmethod
    def blacklist_refresh_token(refresh_token):
        """Đưa refresh token vào blacklist để vô hiệu hóa khi người dùng đăng xuất."""
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except Exception:
                pass
