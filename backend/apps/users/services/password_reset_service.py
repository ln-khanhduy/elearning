from django.conf import settings
from django.core import signing
from django.core.cache import cache
from django.core.mail import send_mail
from jsonschema import ValidationError

from apps.users.services.otp_service import OTPService, OTP_EXPIRE_SECONDS
from apps.users.repositories.auth_repository import AuthRepository


RESET_TOKEN_EXPIRE_SECONDS = 60 * 30


class PasswordResetService:
    """Service quản lý quá trình đặt lại mật khẩu - OTP, token, gửi email và cập nhật mật khẩu."""

    PREFIX = "password_reset"

    @staticmethod
    def get_otp_cache_key(email: str):
        """Tạo key cache lưu OTP đặt lại mật khẩu theo email."""
        return f"password_reset_otp:{email.lower()}"

    @staticmethod
    def get_reset_token_cache_key(token: str):
        """Tạo key cache lưu token đặt lại mật khẩu để kiểm tra đã sử dụng."""
        return f"password_reset_token:{token}"

    @staticmethod
    def check_otp_locked(email: str):
        """Kiểm tra email có đang bị khóa do nhập sai OTP đặt lại mật khẩu quá nhiều lần hay không."""
        return OTPService.check_locked(PasswordResetService.PREFIX, email)

    @staticmethod
    def increment_otp_attempts(email: str):
        """Tăng số lần thử OTP đặt lại mật khẩu cho email và trả về số lần thử sau khi tăng."""
        return OTPService.increment_attempts(PasswordResetService.PREFIX, email)

    @staticmethod
    def reset_otp_attempts(email: str):
        """Đặt lại số lần thử OTP đặt lại mật khẩu cho email về 0 (gọi khi OTP được xác thực thành công)."""
        OTPService.reset_attempts(PasswordResetService.PREFIX, email)

    @staticmethod
    def lock_otp_for_email(email: str):
        """Khóa email khi người dùng nhập sai OTP đặt lại mật khẩu quá số lần cho phép."""
        OTPService.lock_email(PasswordResetService.PREFIX, email)

    @staticmethod
    def set_otp_code(email: str, code: str):
        """Lưu mã OTP đặt lại mật khẩu vào cache với thời gian hết hạn."""
        cache.set(PasswordResetService.get_otp_cache_key(email), code, OTP_EXPIRE_SECONDS)

    @staticmethod
    def get_otp_code(email: str):
        """Lấy mã OTP đặt lại mật khẩu từ cache."""
        return cache.get(PasswordResetService.get_otp_cache_key(email))

    @staticmethod
    def delete_otp_code(email: str):
        """Xóa mã OTP đặt lại mật khẩu khỏi cache (gọi khi OTP đã được sử dụng hoặc hết hạn)."""
        cache.delete(PasswordResetService.get_otp_cache_key(email))

    @staticmethod
    def get_password_reset_token(email: str):
        """Tạo token đặt lại mật khẩu dùng một lần dựa trên email, có ký số để chống giả mạo."""
        signer = signing.TimestampSigner(salt="password-reset")
        return signer.sign(email.lower())

    @staticmethod
    def verify_password_reset_token(token: str):
        """Xác minh token đặt lại mật khẩu và trả về email nếu token hợp lệ và chưa hết hạn."""
        signer = signing.TimestampSigner(salt="password-reset")
        return signer.unsign(token, max_age=RESET_TOKEN_EXPIRE_SECONDS)

    @staticmethod
    def is_reset_token_used(token: str):
        """Kiểm tra token đặt lại mật khẩu đã được sử dụng hay chưa dựa trên cache."""
        return cache.get(PasswordResetService.get_reset_token_cache_key(token)) is not None

    @staticmethod
    def mark_reset_token_used(token: str):
        """Đánh dấu token đặt lại mật khẩu đã được sử dụng để tránh dùng lại."""
        cache.set(
            PasswordResetService.get_reset_token_cache_key(token),
            True,
            RESET_TOKEN_EXPIRE_SECONDS,
        )

    @staticmethod
    def send_password_reset_email(email: str, code: str):
        """Gửi email chứa mã OTP đặt lại mật khẩu cho người dùng."""
        subject = "Mã OTP khôi phục mật khẩu"

        message = (
            f"Xin chào,\n\n"
            f"Bạn vừa yêu cầu khôi phục mật khẩu.\n"
            f"Mã OTP của bạn là: {code}\n\n"
            f"Mã có hiệu lực trong {OTP_EXPIRE_SECONDS // 60} phút. "
            f"Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.\n\n"
            f"LSN Learn"
        )

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )

    @staticmethod
    def send_reset_otp(email):
        """
        Xử lý yêu cầu gửi mã OTP đặt lại mật khẩu.
        - Kiểm tra email không bị khóa
        - Tạo OTP mới, lưu vào cache và gửi email
        """
        email = email.lower()

        if PasswordResetService.check_otp_locked(email):
            raise ValidationError("Email này đã bị khóa tạm thời do nhập sai OTP quá 5 lần. Vui lòng thử lại trong 30 phút.")

        otp_code = OTPService.generate_otp_code()
        PasswordResetService.set_otp_code(email, otp_code)
        PasswordResetService.send_password_reset_email(email, otp_code)

    @staticmethod
    def verify_otp_and_create_token(email, otp):
        """
        Xác thực mã OTP đặt lại mật khẩu và tạo token nếu OTP hợp lệ.
        - Kiểm tra email không bị khóa
        - Kiểm tra OTP khớp với cache
        - Nếu sai quá 5 lần: khóa email
        - Nếu đúng: xóa OTP, reset attempts, trả về token
        """
        email = email.lower()

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
        return PasswordResetService.get_password_reset_token(email)

    @staticmethod
    def reset_password(token, password):
        """
        Đặt lại mật khẩu mới bằng token đã được xác thực.
        - Kiểm tra token hợp lệ, chưa hết hạn và chưa được sử dụng
        - Cập nhật mật khẩu mới cho user
        - Đánh dấu token đã sử dụng
        """
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
        user.save(update_fields=["password"])
        PasswordResetService.mark_reset_token_used(token)
        return user
