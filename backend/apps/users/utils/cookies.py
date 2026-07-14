from django.conf import settings

REFRESH_COOKIE_NAME = "refresh_token"


def set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="None" if not settings.DEBUG else "Lax",
        max_age=7 * 24 * 60 * 60,
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
