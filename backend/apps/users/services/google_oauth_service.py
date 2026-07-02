import secrets

from django.conf import settings
from rest_framework.exceptions import ValidationError
from google.auth.transport import requests
from google.oauth2 import id_token

from apps.users.repositories import auth_repository


def verify_google_token(id_token_value):
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

    if not google_info.get("email"):
        raise ValidationError("Google không trả về email.")

    return google_info


def get_or_create_google_user(google_info: dict):
    email = google_info.get("email")

    if not email:
        raise ValidationError("Google không trả về email.")

    email = email.lower()

    user = auth_repository.get_user_by_email(email)

    if user:
        return user

    role = auth_repository.get_or_create_role("STUDENT", "Student")

    user = auth_repository.create_user(
        email=email,
        password=secrets.token_urlsafe(32),
        first_name=google_info.get("given_name", ""),
        last_name=google_info.get("family_name", ""),
        role=role,
    )

    return user


def login_with_google_id_token(id_token_value):
    google_info = verify_google_token(id_token_value)
    user = get_or_create_google_user(google_info)
    if not user.is_active:
        raise ValidationError("Tài khoản không hợp lệ hoặc đã bị khóa.")
    return user