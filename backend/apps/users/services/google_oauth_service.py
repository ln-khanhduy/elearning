import json
import secrets
import urllib.parse
import urllib.request

from django.conf import settings
from rest_framework.exceptions import ValidationError

from apps.users.repositories.auth_repository import AuthRepository


class GoogleOAuthService:
    # Xây dựng URL để chuyển hướng người dùng đến trang đăng nhập Google
    @staticmethod
    def build_google_oauth_url():
        query = urllib.parse.urlencode({
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "select_account",
        })

        return f"https://accounts.google.com/o/oauth2/v2/auth?{query}"
    # Trao đổi mã code lấy access token và id token từ Google
    @staticmethod
    def exchange_google_code(code: str):
        token_url = "https://oauth2.googleapis.com/token"

        payload = urllib.parse.urlencode({
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }).encode()

        request_obj = urllib.request.Request(
            token_url,
            data=payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        with urllib.request.urlopen(request_obj, timeout=30) as response:
            return json.loads(response.read().decode())
    # Xác minh id token và lấy thông tin người dùng từ Google
    @staticmethod
    def verify_google_id_token(id_token: str):
        verify_url = (
            "https://oauth2.googleapis.com/tokeninfo"
            f"?id_token={urllib.parse.quote(id_token)}"
        )

        with urllib.request.urlopen(verify_url, timeout=20) as response:
            info = json.loads(response.read().decode())

        if info.get("aud") != settings.GOOGLE_CLIENT_ID:
            raise ValidationError("Token Google không hợp lệ.")

        if info.get("email_verified") not in ("true", True):
            raise ValidationError("Email Google chưa được xác thực.")

        return info
    # Lấy hoặc tạo user dựa trên thông tin từ Google
    @staticmethod
    def get_or_create_google_user(google_info: dict):
        email = google_info.get("email")

        if not email:
            raise ValidationError("Google không trả về email.")

        email = email.lower()

        user = AuthRepository.get_user_by_email(email)

        if user:
            return user

        role = AuthRepository.get_or_create_role("STUDENT", "Student")

        user = AuthRepository.create_user(
            username=email,
            email=email,
            password=secrets.token_urlsafe(32),
            first_name=google_info.get("given_name", ""),
            last_name=google_info.get("family_name", ""),
            role=role,
        )

        user.google_avatar_url = google_info.get("picture", "")
        user.save(update_fields=["google_avatar_url"])

        return user

    """
    Chức năng: Xử lý đăng nhập bằng tài khoản Google
    Đầu vào: - code: Mã code nhận được từ Google sau khi người dùng đăng nhập thành công
    Đầu ra: - user: Đối tượng người dùng đã được xác thực hoặc tạo mới dựa trên thông tin từ Google
    """
    @staticmethod
    def login_with_google_code(code):
        token_data = GoogleOAuthService.exchange_google_code(code)
        id_token = token_data.get("id_token")

        if not id_token:
            raise ValidationError("Không nhận được id_token từ Google.")

        google_info = GoogleOAuthService.verify_google_id_token(id_token)
        return GoogleOAuthService.get_or_create_google_user(google_info)