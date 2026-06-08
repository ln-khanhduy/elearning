from django.conf import settings
from django.core import signing
from django.core.cache import cache
from django.core.mail import send_mail
from jsonschema import ValidationError

from apps.users.services.otp_service import OTPService, OTP_EXPIRE_SECONDS
from apps.users.repositories.auth_repository import AuthRepository


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

    """ 
    Chức năng: Xử lý yêu cầu gửi mã OTP đặt lại mật khẩu mới cho email đã đăng ký trước đó.
    Đầu vào: email (địa chỉ email của người dùng)
    Đầu ra: Hệ thống sẽ gửi mã OTP mới đến email người dùng nếu thông tin hợp lệ và không bị khóa.
    Nếu email bị khóa hoặc không tồn tại tài khoản liên quan, sẽ trả về lỗi tương ứng.
    """
    @staticmethod
    def send_reset_otp(email):
        email = email.lower()

        if PasswordResetService.check_otp_locked(email):
            raise ValidationError("Email này đã bị khóa tạm thời do nhập sai OTP quá 5 lần. Vui lòng thử lại trong 30 phút.")

        otp_code = OTPService.generate_otp_code()
        PasswordResetService.set_otp_code(email, otp_code)
        PasswordResetService.send_password_reset_email(email, otp_code)


    """
    Chức năng: Xử lý yêu cầu xác thực mã OTP đặt lại mật khẩu và tạo token đặt lại nếu OTP hợp lệ.
    Đầu vào: email (địa chỉ email của người dùng), otp (mã OTP do người dùng nhập để xác thực)
    Đầu ra: Nếu OTP hợp lệ, hệ thống sẽ trả về token đặt lại mật khẩu. Nếu OTP không hợp lệ hoặc có lỗi khác, sẽ trả về lỗi tương ứng.
    """
    @staticmethod
    def verify_otp_and_create_token(email, otp):
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

        
    """ 
    Chức năng: Xử lý yêu cầu đặt lại mật khẩu mới bằng token đặt lại mật khẩu.
    Đầu vào: token (token đặt lại mật khẩu), password (mật khẩu mới)
    Đầu ra: Nếu token hợp lệ và chưa được sử dụng, hệ thống sẽ cập nhật mật khẩu mới cho tài khoản liên quan và trả về đối tượng User.
    Nếu token không hợp lệ, đã được sử dụng, hoặc có lỗi khác, sẽ trả về lỗi tương ứng.
    """
    @staticmethod
    def reset_password(token, password):
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