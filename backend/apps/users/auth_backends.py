from django.contrib.auth.backends import ModelBackend


class AllowInactiveModelBackend(ModelBackend):
    """
    Custom authentication backend cho phép user bị khóa (is_active=False)
    vẫn có thể xác thực credentials (email/password).

    Mặc định Django ModelBackend từ chối user không active,
    khiến authenticate() trả về None và không thể phân biệt
    "sai mật khẩu" với "tài khoản bị khóa".

    Backend này bỏ qua kiểm tra is_active, để LoginSerializer
    tự kiểm tra và trả về thông báo lỗi phù hợp.
    """

    def user_can_authenticate(self, user):
        """
        Cho phép tất cả user có thể xác thực, kể cả is_active=False.
        """
        return True
