import secrets

from django.core.cache import cache


OTP_EXPIRE_SECONDS = 60 * 3
OTP_LOCK_SECONDS = 60 * 30


class OTPService:
    """Service quản lý OTP - tạo mã, kiểm tra khóa, quản lý số lần thử và khóa email khi nhập sai quá nhiều."""

    @staticmethod
    def generate_otp_code():
        """Tạo mã OTP 6 chữ số ngẫu nhiên."""
        return f"{secrets.randbelow(1000000):06d}"

    @staticmethod
    def get_attempts_cache_key(prefix: str, email: str):
        """Tạo key cache để lưu số lần thử OTP theo prefix và email."""
        return f"{prefix}_otp_attempts:{email.lower()}"

    @staticmethod
    def get_locked_cache_key(prefix: str, email: str):
        """Tạo key cache để lưu trạng thái khóa email theo prefix và email."""
        return f"{prefix}_otp_locked:{email.lower()}"

    @staticmethod
    def check_locked(prefix: str, email: str):
        """Kiểm tra email có đang bị khóa do nhập sai OTP quá nhiều lần hay không."""
        return cache.get(OTPService.get_locked_cache_key(prefix, email)) is not None

    @staticmethod
    def increment_attempts(prefix: str, email: str):
        """Tăng số lần thử OTP cho email và trả về số lần thử sau khi tăng."""
        key = OTPService.get_attempts_cache_key(prefix, email)
        attempts = cache.get(key, 0)
        attempts += 1
        cache.set(key, attempts, OTP_LOCK_SECONDS)
        return attempts

    @staticmethod
    def reset_attempts(prefix: str, email: str):
        """Đặt lại số lần thử OTP cho email về 0 (gọi khi OTP được xác thực thành công)."""
        cache.delete(OTPService.get_attempts_cache_key(prefix, email))

    @staticmethod
    def lock_email(prefix: str, email: str):
        """Khóa email khi người dùng nhập sai OTP quá số lần cho phép."""
        cache.set(
            OTPService.get_locked_cache_key(prefix, email),
            True,
            OTP_LOCK_SECONDS,
        )
