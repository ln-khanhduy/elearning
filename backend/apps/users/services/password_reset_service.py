from django.conf import settings
from django.core import signing
from django.core.cache import cache
from django.core.mail import send_mail

from apps.users.services.otp_service import OTPService, OTP_EXPIRE_SECONDS


RESET_TOKEN_EXPIRE_SECONDS = 60 * 30


class PasswordResetService:
    PREFIX = "password_reset"
    # Tạo key cache lưu OTP quên mật khẩu theo email người dùng 
    @staticmethod
    def get_otp_cache_key(email: str):
        return f"password_reset_otp:{email.lower()}"
    """
    Chức năng: Quản lý OTP và token cho quá trình đặt lại mật khẩu, bao gồm:
    Đầu vào: token (mã token dùng một lần để xác thực yêu cầu đặt lại mật khẩu)
    Đầu ra: Trả về True nếu token đã được sử dụng, False nếu chưa.
    """
    @staticmethod
    def get_reset_token_cache_key(token: str):
        return f"password_reset_token:{token}"
    """
    Chức năng: Kiểm tra xem email đã bị khóa do nhập sai OTP quá nhiều lần hay chưa.
    Đầu vào: email (địa chỉ email của người dùng)
    Đầu ra: Trả về True nếu email đang bị khóa, False nếu không.
    """
    @staticmethod
    def check_otp_locked(email: str):
        return OTPService.check_locked(PasswordResetService.PREFIX, email)
    """
    Chức năng: Tăng số lần thử OTP cho email.
    Đầu vào: email (địa chỉ email của người dùng)
    Đầu ra: Trả về số lần thử OTP sau khi được tăng.
    """
    @staticmethod
    def increment_otp_attempts(email: str):
        return OTPService.increment_attempts(PasswordResetService.PREFIX, email)
    """
    Chức năng: Đặt lại số lần thử OTP cho email (thường được gọi khi OTP được sử dụng thành công).
    Đầu vào: email (địa chỉ email của người dùng)
    Đầu ra: Không có, nhưng sẽ xóa cache liên quan đến số lần thử OTP của email.
    """
    @staticmethod
    def reset_otp_attempts(email: str):
        OTPService.reset_attempts(PasswordResetService.PREFIX, email)
    """
    Chức năng: Khóa email khi người dùng nhập sai OTP quá nhiều lần.
    Đầu vào: email (địa chỉ email của người dùng)
    Đầu ra: Không có, nhưng sẽ cập nhật cache để đánh dấu email là bị khóa trong một khoảng thời gian nhất định.
    """
    @staticmethod
    def lock_otp_for_email(email: str):
        OTPService.lock_email(PasswordResetService.PREFIX, email)
    """
    Chức năng: Quản lý OTP cho quá trình đặt lại mật khẩu, bao gồm:
    Đầu vào: email (địa chỉ email của người dùng), code (mã OTP được tạo ra)
    Đầu ra: Không có, nhưng sẽ lưu mã OTP vào cache với thời gian hết hạn nhất định.
    """
    @staticmethod
    def set_otp_code(email: str, code: str):
        cache.set(PasswordResetService.get_otp_cache_key(email),code,OTP_EXPIRE_SECONDS,)
    """
    Chức năng: gửi email chứa mã OTP cho người dùng khi họ yêu cầu đặt lại mật khẩu.
    Đầu vào: email (địa chỉ email của người dùng), code (mã OTP được tạo ra)
    Đầu ra: Không có, nhưng sẽ sử dụng hệ thống email của Django để gửi email đến người dùng.
    """
    @staticmethod
    def get_otp_code(email: str):
        return cache.get(PasswordResetService.get_otp_cache_key(email))
    """
    Chức năng: Xóa mã OTP khỏi cache, thường được gọi sau khi OTP đã được sử dụng thành công hoặc khi hết hạn.
    Đầu vào: email (địa chỉ email của người dùng)
    Đầu ra: Không có, nhưng sẽ xóa mã OTP khỏi cache.
    """
    @staticmethod
    def delete_otp_code(email: str):
        cache.delete(PasswordResetService.get_otp_cache_key(email))
    """
    Chức năng: Tạo token đặt lại mật khẩu dùng một lần dựa trên email người dùng.
    Đầu vào: email (địa chỉ email của người dùng)
    Đầu ra: Trả về token đặt lại mật khẩu.
    """
    @staticmethod
    def get_password_reset_token(email: str):
        signer = signing.TimestampSigner(salt="password-reset")
        return signer.sign(email.lower())
    """
    Chức năng: Xác minh token đặt lại mật khẩu và lấy email người dùng từ token.
    Đầu vào: token (mã token dùng một lần để xác thực yêu cầu đặtlại mật khẩu)
    Đầu ra: Trả về email người dùng nếu token hợp lệ, hoặc ném lỗi nếu không hợp lệ.
    """
    @staticmethod
    def verify_password_reset_token(token: str):
        signer = signing.TimestampSigner(salt="password-reset")
        return signer.unsign(token, max_age=RESET_TOKEN_EXPIRE_SECONDS)
    """
    Chức năng: Kiểm tra xem token đặt lại mật khẩu đã được sử dụng hay chưa, dựa trên việc kiểm tra cache.
    Đầu vào: token (mã token dùng một lần để xác thực yêu cầu đặt lại mật khẩu)
    Đầu ra: Trả về True nếu token đã được sử dụng, False nếu chưa.
    """
    @staticmethod
    def is_reset_token_used(token: str):
        return cache.get(PasswordResetService.get_reset_token_cache_key(token)) is not None
    """
    Chức năng: Đánh dấu token đặt lại mật khẩu đã được sử dụng bằng cách lưu trạng thái vào cache với thời gian hết hạn.
    Đầu vào: token (mã token dùng một lần để xác thực yêu cầu đặt lại mật khẩu)
    Đầu ra: Không có, nhưng sẽ cập nhật cache để đánh dấu token là đã sử dụng trong một khoảng thời gian nhất định.
    """
    @staticmethod
    def mark_reset_token_used(token: str):
        cache.set( PasswordResetService.get_reset_token_cache_key(token),True,RESET_TOKEN_EXPIRE_SECONDS,)

    """
    Chức năng: Gửi email chứa mã OTP cho người dùng khi họ yêu cầu đặt lại mật khẩu.
    Đầu vào: email (địa chỉ email của người dùng), code (mã OTP được tạo ra)
    Đầu ra: Không có, nhưng sẽ sử dụng hệ thống email của Django để gửi email đến người dùng.
    """
    @staticmethod
    def send_password_reset_email(email: str, code: str):
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