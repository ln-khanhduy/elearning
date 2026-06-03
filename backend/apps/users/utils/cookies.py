from django.conf import settings

REFRESH_COOKIE_NAME = 'refresh_token'
REFRESH_COOKIE_PATH = '/'


def set_refresh_cookie(response, refresh_token):
    max_age = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())

    response.set_cookie(
        REFRESH_COOKIE_NAME,
        refresh_token,
        httponly=True,
        secure=True,
        samesite='Lax',
        path=REFRESH_COOKIE_PATH,
        max_age=max_age,
    )


def delete_refresh_cookie(response):
    response.delete_cookie(
        REFRESH_COOKIE_NAME,
        path=REFRESH_COOKIE_PATH,
        samesite='Lax',
        secure=True,
    )
