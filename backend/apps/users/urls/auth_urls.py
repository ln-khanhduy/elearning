from django.urls import path
from apps.users.view.auth_views import (
    AuthLoginView,
    AuthLogoutView,
    AuthSessionView,
    ForgotPasswordView,
    RegisterResendOTPView,
    RegisterSendOTPView,
    RegisterVerifyOTPView,
    ResetPasswordView,
    TokenRefreshCookieView,
    VerifyOTPView,
    GoogleIdTokenLoginView,
)

urlpatterns = [
    path("register/send-otp/", RegisterSendOTPView.as_view(), name="auth-register-send-otp"),
    path("register/resend-otp/", RegisterResendOTPView.as_view(), name="auth-register-resend-otp"),
    path("register/verify-otp/", RegisterVerifyOTPView.as_view(), name="auth-register-verify-otp"),

    path("login/", AuthLoginView.as_view(), name="auth-login"),
    path("logout/", AuthLogoutView.as_view(), name="auth-logout"),
    path("session/", AuthSessionView.as_view(), name="auth-session"),
    path("token/refresh/", TokenRefreshCookieView.as_view(), name="auth-token-refresh"),

    path("forgot-password/", ForgotPasswordView.as_view(), name="auth-forgot-password"),
    path("verify-otp/", VerifyOTPView.as_view(), name="auth-verify-otp"),
    path("reset-password/", ResetPasswordView.as_view(), name="auth-reset-password"),
 
    path("google/id-token-login/", GoogleIdTokenLoginView.as_view(), name="auth-google-id-token-login"),  
]
