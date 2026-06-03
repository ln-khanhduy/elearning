from django.urls import path
from apps.users.view.auth_views import (
     AuthLoginView,
    AuthLogoutView,
    ForgotPasswordView,
    GoogleCallbackView,
    GoogleLoginRedirect,
     RegisterResendOTPView,
    RegisterSendOTPView,
    RegisterVerifyOTPView,
    ResetPasswordView,
    TokenRefreshCookieView,
    VerifyOTPView,
)
from apps.users.view.user_views import CurrentUserView
urlpatterns = [
    #auth urls
    path('register/send-otp/', RegisterSendOTPView.as_view(), name='auth-register-send-otp'),
    path('register/verify-otp/', RegisterVerifyOTPView.as_view(), name='auth-register-verify-otp'),
    path('login/', AuthLoginView.as_view(), name='auth-login'),
    path('logout/', AuthLogoutView.as_view(), name='auth-logout'),
    path('token/refresh/', TokenRefreshCookieView.as_view(), name='auth-token-refresh'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('verify-otp/', VerifyOTPView.as_view(), name='auth-verify-otp'),
    path("auth/register/resend-otp/",RegisterResendOTPView.as_view(),name="register-resend-otp"),
    path('reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
    path('google/login/', GoogleLoginRedirect.as_view(), name='auth-google-login'),
    path('google/callback/', GoogleCallbackView.as_view(), name='auth-google-callback'),

    #user urls
    path('me/', CurrentUserView.as_view(), name='auth-me'),
]
