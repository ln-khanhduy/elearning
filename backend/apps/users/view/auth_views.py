import urllib.parse

from django.conf import settings
from django.http import HttpResponseRedirect
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.views import TokenRefreshView

from apps.users.serializers.auth_serializer import (
    ForgotPasswordSerializer, LoginSerializer, RegisterResendOTPSerializer,
    RegisterSendOTPSerializer, RegisterVerifyOTPSerializer, ResetPasswordSerializer,
    UserSerializer, VerifyOTPSerializer,
)
from apps.users.services.auth_service import AuthService
from apps.users.services.google_oauth_service import GoogleOAuthService
from apps.users.services.password_reset_service import PasswordResetService
from apps.users.services.register_service import RegisterService
from apps.users.utils.cookies import REFRESH_COOKIE_NAME, delete_refresh_cookie, set_refresh_cookie


@method_decorator(ensure_csrf_cookie, name="dispatch")
class RegisterSendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        RegisterService.send_register_otp(data["full_name"], data["email"], data["password"])
        return Response({"detail": "Đã gửi mã OTP đăng ký đến email."}, status=status.HTTP_200_OK)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class RegisterVerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterVerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = RegisterService.verify_register_otp(serializer.validated_data["email"], serializer.validated_data["otp"])
        tokens = AuthService.generate_tokens_for_user(user)

        response = Response({"user": UserSerializer(user).data, "access": tokens["access"]}, status=status.HTTP_201_CREATED)
        set_refresh_cookie(response, tokens["refresh"])
        return response


@method_decorator(ensure_csrf_cookie, name="dispatch")
class AuthLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        tokens = AuthService.generate_tokens_for_user(user)

        response = Response({"user": UserSerializer(user).data, "access": tokens["access"]}, status=status.HTTP_200_OK)
        set_refresh_cookie(response, tokens["refresh"])
        return response


class AuthLogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        AuthService.blacklist_refresh_token(request.COOKIES.get(REFRESH_COOKIE_NAME))
        response = Response({"detail": "Đã đăng xuất thành công."}, status=status.HTTP_200_OK)
        delete_refresh_cookie(response)
        return response


class TokenRefreshCookieView(TokenRefreshView):
    permission_classes = [AllowAny]
    serializer_class = TokenRefreshSerializer

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE_NAME)

        if not refresh_token:
            raise ValidationError("Refresh token không tìm thấy.")

        serializer = self.get_serializer(data={"refresh": refresh_token})
        serializer.is_valid(raise_exception=True)

        response = Response(serializer.validated_data, status=status.HTTP_200_OK)
        new_refresh = serializer.validated_data.get("refresh")

        if new_refresh:
            set_refresh_cookie(response, new_refresh)

        return response


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        PasswordResetService.send_reset_otp(serializer.validated_data["email"])
        return Response({"detail": "Đã gửi mã OTP đến email. Vui lòng kiểm tra hộp thư đến."}, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reset_token = PasswordResetService.verify_otp_and_create_token(serializer.validated_data["email"], serializer.validated_data["otp"])
        return Response({"detail": "OTP hợp lệ.", "reset_token": reset_token}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        PasswordResetService.reset_password(serializer.validated_data["token"], serializer.validated_data["password"])
        return Response({"detail": "Mật khẩu mới đã được cập nhật."}, status=status.HTTP_200_OK)


class GoogleLoginRedirect(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return HttpResponseRedirect(GoogleOAuthService.build_google_oauth_url())


@method_decorator(ensure_csrf_cookie, name="dispatch")
class GoogleCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.GET.get("code")

        if not code:
            return Response({"detail": "Không nhận được mã Google."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = GoogleOAuthService.login_with_google_code(code)
            tokens = AuthService.generate_tokens_for_user(user)
            response = HttpResponseRedirect(urllib.parse.urljoin(settings.FRONTEND_URL, "/oauth-success"))
            set_refresh_cookie(response, tokens["refresh"])
            return response
        except Exception as exc:
            fallback_url = urllib.parse.urljoin(settings.FRONTEND_URL, f"/login?error={urllib.parse.quote(str(exc))}")
            return HttpResponseRedirect(fallback_url)


class RegisterResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        RegisterService.resend_register_otp(serializer.validated_data["email"])
        return Response({"detail": "Mã OTP mới đã được gửi."}, status=status.HTTP_200_OK)