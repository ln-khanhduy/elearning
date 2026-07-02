from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.repositories import user_repository
def generate_tokens_for_user(user):
    """Tạo cặp token JWT (access + refresh) cho người dùng sau khi đăng nhập thành công."""
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}
def update_last_login(user):
    """Cập nhật thời gian đăng nhập cuối cùng cho user. Dùng chung cho mọi luồng đăng nhập."""
    user_repository.update_last_login(user)
def blacklist_refresh_token(refresh_token):
    """Đưa refresh token vào blacklist để vô hiệu hóa khi người dùng đăng xuất."""
    if refresh_token:
        try:
            RefreshToken(refresh_token).blacklist()
        except Exception:
            pass
