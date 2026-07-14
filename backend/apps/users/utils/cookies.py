from django.conf import settings

REFRESH_COOKIE_NAME = "refresh_token"


def set_refresh_cookie(response, refresh_token):
    # Lấy thời gian sống từ settings (REFRESH_TOKEN_LIFETIME) hoặc mặc định 1 ngày
    from rest_framework_simplejwt.settings import api_settings as jwt_settings
    refresh_lifetime = jwt_settings.REFRESH_TOKEN_LIFETIME
    max_age_seconds = int(refresh_lifetime.total_seconds())

    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="None" if not settings.DEBUG else "Lax",
        max_age=max_age_seconds,
        path="/",
        domain=None,
    )


def delete_refresh_cookie(response):
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/",
        samesite="None" if not settings.DEBUG else "Lax",
        domain=None,
    )
