import json
import secrets
import urllib.parse
import urllib.request

from django.conf import settings
from rest_framework.exceptions import ValidationError
from google.auth.transport import requests
from google.oauth2 import id_token

from apps.users.repositories.auth_repository import AuthRepository


class GoogleOAuthService:
    """Service xử lý đăng nhập bằng Google OAuth - xác thực token và tạo/tìm user."""

    @staticmethod
    def get_or_create_google_user(google_info: dict):
        """
        Tìm user theo email từ Google, nếu chưa tồn tại thì tạo mới với role STUDENT.
        - Nếu user đã tồn tại: trả về user hiện tại
        - Nếu user chưa tồn tại: tạo user mới với password ngẫu nhiên và avatar từ Google
        """
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

    @staticmethod
    def login_with_google_id_token(id_token_value):
        """
        Xác thực id_token từ Google và trả về user tương ứng.
        - Xác minh token với Google OAuth2
        - Kiểm tra email đã được xác thực
        - Tạo hoặc lấy user từ thông tin Google
        """
        try:
            google_info = id_token.verify_oauth2_token(
                id_token_value,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except Exception:
            raise ValidationError("Token Google không hợp lệ.")

        if not google_info.get("email_verified"):
            raise ValidationError("Email Google chưa được xác thực.")

        return GoogleOAuthService.get_or_create_google_user(google_info)
