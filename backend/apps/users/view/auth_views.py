
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework_simplejwt.tokens import RefreshToken

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
    permission_classes = [IsAuthenticated]

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

        try:
            serializer.is_valid(raise_exception=True)
        except (TokenError, InvalidToken):
            response = Response({"detail": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."}, status=status.HTTP_401_UNAUTHORIZED)
            delete_refresh_cookie(response)
            return response

        response = Response(serializer.validated_data, status=status.HTTP_200_OK)
        new_refresh = serializer.validated_data.get("refresh")

        if new_refresh:
            set_refresh_cookie(response, new_refresh)

        return response


class AuthSessionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE_NAME)

        if not refresh_token:
            return Response(
                {"detail": "Refresh token không tìm thấy."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            refresh = RefreshToken(refresh_token)
            access = str(refresh.access_token)

            User = get_user_model()
            user = User.objects.select_related("role").get(id=refresh["user_id"])
        except Exception:
            response = Response(
                {"detail": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            delete_refresh_cookie(response)
            return response

        return Response(
            {
                "access": access,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


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


class RegisterResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        RegisterService.resend_register_otp(serializer.validated_data["email"])
        return Response({"detail": "Mã OTP mới đã được gửi."}, status=status.HTTP_200_OK)
    
class GoogleIdTokenLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        id_token_value = request.data.get("id_token")

        if not id_token_value:
            return Response(
                {"detail": "Thiếu id_token Google."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = GoogleOAuthService.login_with_google_id_token(id_token_value)
        tokens = AuthService.generate_tokens_for_user(user)

        response = Response(
            {
                "access": tokens["access"],
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK
        )

        set_refresh_cookie(response, tokens["refresh"])
        return response