import secrets

from django.core.cache import cache


OTP_EXPIRE_SECONDS = 60 * 3
OTP_LOCK_SECONDS = 60 * 30


class OTPService:
    # Tạo mã OTP 6 chữ số ngẫu nhiên
    @staticmethod
    def generate_otp_code():
        return f"{secrets.randbelow(1000000):06d}"
    """
    Chức năng: Quản lý số lần thử và khóa email khi nhập sai OTP quá nhiều lần.
    Đầu vào: prefix (chuỗi để phân biệt loại OTP, ví dụ: 'register', 'reset_password'), email (địa chỉ email của người dùng)
    Đầu ra: Không có, nhưng sẽ cập nhật cache để theo dõi số lần thử và trạng thái khóa của email.
    """
    @staticmethod
    def get_attempts_cache_key(prefix: str, email: str):
        return f"{prefix}_otp_attempts:{email.lower()}"
    """
    Chức năng: Kiểm tra xem email đã bị khóa do nhập sai OTP quá nhiều lần hay chưa.
    Đầu vào: prefix (chuỗi để phân biệt loại OTP), email (địa chỉ email của người dùng)
    Đầu ra: Trả về True nếu email đang bị khóa, False nếu không.
    """
    @staticmethod
    def get_locked_cache_key(prefix: str, email: str):
        return f"{prefix}_otp_locked:{email.lower()}"
    """
    Chức năng: Kiểm tra xem email đã bị khóa hay chưa.
    Đầu vào: prefix (chuỗi để phân biệt loại OTP), email (địa chỉ email của người dùng)
    Đầu ra: Trả về True nếu email đang bị khóa, False nếu không.
    """
    @staticmethod
    def check_locked(prefix: str, email: str):
        return cache.get(OTPService.get_locked_cache_key(prefix, email)) is not None
    """
    Chức năng: Tăng số lần thử OTP cho email.
    Đầu vào: prefix (chuỗi để phân biệt loại OTP), email (địa chỉ email của người dùng)
    Đầu ra: Trả về số lần thử sau khi được tăng.
    """
    @staticmethod
    def increment_attempts(prefix: str, email: str):
        key = OTPService.get_attempts_cache_key(prefix, email)
        attempts = cache.get(key, 0)
        attempts += 1
        cache.set(key, attempts, OTP_LOCK_SECONDS)
        return attempts
    """
    Chức năng: Đặt lại số lần thử OTP cho email (thường được gọikhi người dùng nhập đúng OTP hoặc sau khi thời gian khóa kết thúc).
    Đầu vào: prefix (chuỗi để phân biệt loại OTP), email (địa chỉ email của người dùng)
    Đầu ra: Không có, nhưng sẽ xóa cache liên quan đến số lần thử của email.
    """
    @staticmethod
    def reset_attempts(prefix: str, email: str):
        cache.delete(OTPService.get_attempts_cache_key(prefix, email))
    """
    Chức năng: Khóa email khi người dùng nhập sai OTP quá nhiều lần.
    Đầu vào: prefix (chuỗi để phân biệt loại OTP), email (địa chỉ email của người dùng)
    Đầu ra: Không có, nhưng sẽ cập nhật cache để đánh dấu email là bị khóa trong một khoảng thời gian nhất định.
    """
    @staticmethod
    def lock_email(prefix: str, email: str):
        cache.set(
            OTPService.get_locked_cache_key(prefix, email),
            True,
            OTP_LOCK_SECONDS,
        )