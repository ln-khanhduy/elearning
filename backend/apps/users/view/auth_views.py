from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
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
    ForgotPasswordSerializer, GoogleLoginSerializer, LoginSerializer,
    RegisterResendOTPSerializer, RegisterSendOTPSerializer,
    RegisterVerifyOTPSerializer, ResetPasswordSerializer,
    UserSerializer, VerifyOTPSerializer,
)
from apps.users.services import auth_service
from apps.users.services import google_oauth_service
from apps.users.services import password_reset_service
from apps.users.services import register_service
from apps.users.utils.cookies import REFRESH_COOKIE_NAME, delete_refresh_cookie, set_refresh_cookie
from apps.notifications import services as notif_service


RATE_LIMIT_CACHE_PREFIX = "rate_limit"
RATE_LIMIT_MAX_ATTEMPTS = 5
RATE_LIMIT_WINDOW_SECONDS = 300  # 5 phút


def _check_rate_limit(key: str) -> None:
    """Kiểm tra rate limit dùng cache. Nếu vượt quá số lần cho phép thì raise ValidationError."""
    cache_key = f"{RATE_LIMIT_CACHE_PREFIX}:{key}"
    attempts = cache.get(cache_key, 0)
    if attempts >= RATE_LIMIT_MAX_ATTEMPTS:
        raise ValidationError("Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau 5 phút.")
    cache.set(cache_key, attempts + 1, RATE_LIMIT_WINDOW_SECONDS)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class RegisterSendOTPView(APIView):
    """
    POST /api/auth/register/send-otp/ - Gửi mã OTP đăng ký tài khoản.
    Nhận full_name, email, password, confirm_password, accepted_terms.
    Gửi OTP đến email nếu thông tin hợp lệ.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        register_service.send_register_otp(data["full_name"], data["email"], data["password"])
        return Response({"detail": "Đã gửi mã OTP đăng ký đến email."}, status=status.HTTP_200_OK)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class RegisterVerifyOTPView(APIView):
    """
    POST /api/auth/register/verify-otp/ - Xác thực OTP và tạo tài khoản.
    Nhận email và otp. Nếu OTP hợp lệ, tạo user và trả về token JWT.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterVerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = register_service.verify_register_otp(serializer.validated_data["email"], serializer.validated_data["otp"])
        except ValidationError as e:
            message = e.detail[0] if isinstance(e.detail, list) else str(e.detail)
            return Response({"detail": str(message)}, status=status.HTTP_400_BAD_REQUEST)

        auth_service.update_last_login(user)
        tokens = auth_service.generate_tokens_for_user(user)

        try:
            notif_service.notify_login(user)
        except Exception:
            pass

        response = Response({"user": UserSerializer(user).data, "access": tokens["access"]}, status=status.HTTP_201_CREATED)
        set_refresh_cookie(response, tokens["refresh"])
        return response


@method_decorator(ensure_csrf_cookie, name="dispatch")
class AuthLoginView(APIView):
    """
    POST /api/auth/login/ - Đăng nhập bằng email và password.
    Có rate limit 5 lần/5 phút theo IP. Trả về access token và set refresh token cookie.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        _check_rate_limit(f"login:{request.META.get('REMOTE_ADDR', 'unknown')}")

        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        auth_service.update_last_login(user)
        tokens = auth_service.generate_tokens_for_user(user)

        try:
            notif_service.notify_login(user)
        except Exception:
            pass

        response = Response({"user": UserSerializer(user).data, "access": tokens["access"]}, status=status.HTTP_200_OK)
        set_refresh_cookie(response, tokens["refresh"])
        return response


class AuthLogoutView(APIView):
    """
    POST /api/auth/logout/ - Đăng xuất.
    Blacklist refresh token và xóa cookie.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        auth_service.blacklist_refresh_token(request.COOKIES.get(REFRESH_COOKIE_NAME))
        response = Response({"detail": "Đã đăng xuất thành công."}, status=status.HTTP_200_OK)
        delete_refresh_cookie(response)
        return response


class TokenRefreshCookieView(TokenRefreshView):
    """
    POST /api/auth/token/refresh/ - Làm mới access token bằng refresh token từ cookie.
    Nếu refresh token hết hạn, xóa cookie và trả về 401.
    """
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
    """
    GET /api/auth/session/ - Kiểm tra phiên đăng nhập từ refresh token cookie.
    Nếu token hợp lệ, trả về access token mới và thông tin user.
    """
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

            # Kiểm tra token đã bị blacklist chưa
            try:
                refresh.check_blacklist()
            except Exception:
                response = Response(
                    {"detail": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
                delete_refresh_cookie(response)
                return response

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
    """
    POST /api/auth/forgot-password/ - Gửi mã OTP đặt lại mật khẩu.
    Nhận email, kiểm tra email tồn tại, gửi OTP nếu hợp lệ.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            password_reset_service.send_reset_otp(serializer.validated_data["email"])
        except ValidationError as e:
            message = e.detail[0] if isinstance(e.detail, list) else str(e.detail)
            return Response({"detail": str(message)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Đã gửi mã OTP đến email. Vui lòng kiểm tra hộp thư đến."}, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    """
    POST /api/auth/verify-otp/ - Xác thực OTP đặt lại mật khẩu.
    Nhận email và otp. Nếu OTP hợp lệ, trả về reset_token để đặt mật khẩu mới.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            reset_token = password_reset_service.verify_otp_and_create_token(
                serializer.validated_data["email"], serializer.validated_data["otp"]
            )
        except ValidationError as e:
            message = e.detail[0] if isinstance(e.detail, list) else str(e.detail)
            return Response({"detail": str(message)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "OTP hợp lệ.", "reset_token": reset_token}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """
    POST /api/auth/reset-password/ - Đặt lại mật khẩu mới.
    Nhận token (từ verify-otp), password và confirm_password.
    Cập nhật mật khẩu nếu token hợp lệ.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            password_reset_service.reset_password(serializer.validated_data["token"], serializer.validated_data["password"])
        except ValidationError as e:
            message = e.detail[0] if isinstance(e.detail, list) else str(e.detail)
            return Response({"detail": str(message)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = password_reset_service.get_user_by_token(serializer.validated_data["token"])
            notif_service.notify_password_change(user)
        except Exception:
            pass
        return Response({"detail": "Mật khẩu mới đã được cập nhật."}, status=status.HTTP_200_OK)


class RegisterResendOTPView(APIView):
    """
    POST /api/auth/register/resend-otp/ - Gửi lại mã OTP đăng ký mới.
    Nhận email, kiểm tra thông tin đăng ký còn hiệu lực, gửi OTP mới.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            register_service.resend_register_otp(serializer.validated_data["email"])
        except ValidationError as e:
            message = e.detail[0] if isinstance(e.detail, list) else str(e.detail)
            return Response({"detail": str(message)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Mã OTP mới đã được gửi."}, status=status.HTTP_200_OK)


class GoogleIdTokenLoginView(APIView):
    """
    POST /api/auth/google/ - Đăng nhập bằng Google OAuth.
    Nhận id_token từ Google. Xác thực token, tạo hoặc lấy user, trả về JWT.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = google_oauth_service.login_with_google_id_token(serializer.validated_data["id_token"])
        except ValidationError as e:
            message = e.detail[0] if isinstance(e.detail, list) else str(e.detail)
            return Response({"detail": str(message)}, status=status.HTTP_400_BAD_REQUEST)

        auth_service.update_last_login(user)
        tokens = auth_service.generate_tokens_for_user(user)

        try:
            notif_service.notify_login(user)
        except Exception:
            pass

        response = Response({
            "access": tokens["access"],
            "user": UserSerializer(user).data,
        }, status=status.HTTP_200_OK)

        set_refresh_cookie(response, tokens["refresh"])
        return response
