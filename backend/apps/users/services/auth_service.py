from rest_framework_simplejwt.tokens import RefreshToken


class AuthService:
    # Lấy token mới cho user
    @staticmethod
    def generate_tokens_for_user(user):
        refresh = RefreshToken.for_user(user)
        return {"refresh": str(refresh), "access": str(refresh.access_token)}

    @staticmethod
    def blacklist_refresh_token(refresh_token):
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except Exception:
                pass