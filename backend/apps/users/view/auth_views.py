import urllib.parse

from django.conf import settings
from django.core import signing
from django.http import HttpResponseRedirect
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from apps.users.repositories.auth_repository import AuthRepository
from apps.users.serializers.auth import (
    ForgotPasswordSerializer,
    LoginSerializer,
    RegisterResendOTPSerializer,
    RegisterSendOTPSerializer,
    RegisterVerifyOTPSerializer,
    ResetPasswordSerializer,
    UserSerializer,
    VerifyOTPSerializer,
)
from apps.users.services.auth_service import AuthService
from apps.users.services.google_oauth_service import GoogleOAuthService
from apps.users.services.otp_service import OTPService
from apps.users.services.password_reset_service import PasswordResetService
from apps.users.services.register_service import RegisterService
from apps.users.utils.cookies import (
    REFRESH_COOKIE_NAME,
    delete_refresh_cookie,
    set_refresh_cookie,
)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class RegisterSendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        email = data["email"].lower()

        otp_code = OTPService.generate_otp_code()

        RegisterService.set_register_data(email,{"full_name": data["full_name"],"email": email,"password": data["password"],},)

        RegisterService.set_register_otp(email, otp_code)
        RegisterService.send_register_otp_email(email, otp_code)

        return Response({"detail": "Đã gửi mã OTP đăng ký đến email."},status=status.HTTP_200_OK,)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class RegisterVerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterVerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].lower()
        otp = serializer.validated_data["otp"]

        if RegisterService.check_register_otp_locked(email):
            raise ValidationError("Bạn đã nhập sai OTP quá 5 lần. Vui lòng thử lại sau 30 phút.")

        stored_otp = RegisterService.get_register_otp(email)

        if not stored_otp or stored_otp != otp:
            attempts = RegisterService.increment_register_otp_attempts(email)

            if attempts >= 5:
                RegisterService.lock_register_otp_for_email(email)
                raise ValidationError(f"OTP sai {attempts} lần. Tài khoản tạm khóa 30 phút.")
            raise ValidationError(f"OTP không đúng. Bạn còn {5 - attempts} lần thử.")

        RegisterService.reset_register_otp_attempts(email)

        register_data = RegisterService.get_register_data(email)

        if not register_data:
            raise ValidationError("Thông tin đăng ký đã hết hạn.")
        if AuthRepository.get_user_by_email(email):
            raise ValidationError("Email đã được sử dụng.")

        user = RegisterService.create_student_user(
            full_name=register_data["full_name"],
            email=register_data["email"],
            password=register_data["password"],
        )

        RegisterService.delete_register_otp(email)
        RegisterService.delete_register_data(email)

        tokens = AuthService.generate_tokens_for_user(user)
        response = Response({"user": UserSerializer(user).data,"access": tokens["access"],},status=status.HTTP_201_CREATED,)
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

        response = Response({"user": UserSerializer(user).data,"access": tokens["access"],},status=status.HTTP_200_OK,)
        set_refresh_cookie(response, tokens["refresh"])

        return response


class AuthLogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE_NAME)

        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except Exception:
                pass

        response = Response({"detail": "Đã đăng xuất thành công."},status=status.HTTP_200_OK,)
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

        response = Response(serializer.validated_data,status=status.HTTP_200_OK,)
        new_refresh = serializer.validated_data.get("refresh")

        if new_refresh:
            set_refresh_cookie(response, new_refresh)

        return response


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].lower()

        if PasswordResetService.check_otp_locked(email):
            raise ValidationError("Email này đã bị khóa tạm thời do nhập sai OTP quá 5 lần. Vui lòng thử lại trong 30 phút.")

        otp_code = OTPService.generate_otp_code()

        PasswordResetService.set_otp_code(email, otp_code)
        PasswordResetService.send_password_reset_email(email, otp_code)

        return Response({"detail": "Đã gửi mã OTP đến email. Vui lòng kiểm tra hộp thư đến."},status=status.HTTP_200_OK,)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].lower()
        otp = serializer.validated_data["otp"]

        if PasswordResetService.check_otp_locked(email):
            raise ValidationError("Bạn đã nhập sai OTP quá 5 lần. Vui lòng thử lại trong 30 phút.")

        stored_otp = PasswordResetService.get_otp_code(email)

        if not stored_otp or stored_otp != otp:
            attempts = PasswordResetService.increment_otp_attempts(email)

            if attempts >= 5:
                PasswordResetService.lock_otp_for_email(email)

                raise ValidationError(f"Mã OTP sai. Bạn đã nhập sai {attempts} lần. Tài khoản sẽ bị khóa 30 phút.")

            raise ValidationError(f"Mã OTP không đúng. Bạn còn {5 - attempts} lần thử.")

        PasswordResetService.delete_otp_code(email)
        PasswordResetService.reset_otp_attempts(email)

        reset_token = PasswordResetService.get_password_reset_token(email)

        return Response({"detail": "OTP hợp lệ.","reset_token": reset_token,}, status=status.HTTP_200_OK,)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["token"]
        password = serializer.validated_data["password"]

        if not token or not token.strip():
            raise ValidationError("Token không hợp lệ.")

        try:
            email = PasswordResetService.verify_password_reset_token(token)
        except signing.BadSignature:
            raise ValidationError("Yêu cầu đặt lại mật khẩu không hợp lệ.")
        except signing.SignatureExpired:
            raise ValidationError("Yêu cầu đặt lại mật khẩu đã hết hạn.")

        if PasswordResetService.is_reset_token_used(token):
            raise ValidationError("Yêu cầu đặt lại mật khẩu đã được sử dụng.")

        user = AuthRepository.get_user_by_email(email)

        if not user:
            raise ValidationError("Không tìm thấy tài khoản liên quan đến yêu cầu này.")

        user.set_password(password)
        user.save()

        PasswordResetService.mark_reset_token_used(token)

        return Response({"detail": "Mật khẩu mới đã được cập nhật."},status=status.HTTP_200_OK,)


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
            return Response({"detail": "Không nhận được mã Google."},status=status.HTTP_400_BAD_REQUEST,)

        try:
            token_data = GoogleOAuthService.exchange_google_code(code)
            id_token = token_data.get("id_token")

            if not id_token:
                raise ValidationError("Không nhận được id_token từ Google.")

            google_info = GoogleOAuthService.verify_google_id_token(id_token)
            user = GoogleOAuthService.get_or_create_google_user(google_info)
            tokens = AuthService.generate_tokens_for_user(user)

            response = HttpResponseRedirect(urllib.parse.urljoin(settings.FRONTEND_URL, "/oauth-success"))

            set_refresh_cookie(response, tokens["refresh"])

            return response

        except Exception as exc:
            error_message = str(exc)
            fallback_url = urllib.parse.urljoin(settings.FRONTEND_URL,f"/login?error={urllib.parse.quote(error_message)}",)

            return HttpResponseRedirect(fallback_url)


class RegisterResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        if RegisterService.check_register_otp_locked(email):
            return Response({"detail": "Bạn đã nhập sai OTP quá nhiều lần. Vui lòng thử lại sau."},status=status.HTTP_429_TOO_MANY_REQUESTS,)

        register_data = RegisterService.get_register_data(email)

        if not register_data:
            return Response({"detail": "Thông tin đăng ký đã hết hạn. Vui lòng đăng ký lại."},status=status.HTTP_400_BAD_REQUEST,)

        otp = OTPService.generate_otp_code()

        RegisterService.set_register_otp(email, otp)
        RegisterService.send_register_otp_email(email, otp)

        return Response({"detail": "Mã OTP mới đã được gửi."},status=status.HTTP_200_OK,)