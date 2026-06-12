from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from rest_framework.exceptions import ValidationError

from apps.users.repositories.auth_repository import AuthRepository
from apps.users.services.otp_service import OTPService, OTP_EXPIRE_SECONDS


class RegisterService:
    """Service quản lý quá trình đăng ký tài khoản - OTP, cache thông tin và tạo user."""

    PREFIX = "register"

    @staticmethod
    def get_register_otp_cache_key(email: str):
        """Tạo key cache lưu mã OTP đăng ký theo email."""
        return f"register_otp:{email.lower()}"

    @staticmethod
    def get_register_data_cache_key(email: str):
        """Tạo key cache lưu thông tin đăng ký tạm thời trước khi xác thực OTP."""
        return f"register_data:{email.lower()}"

    @staticmethod
    def check_register_otp_locked(email: str):
        """Kiểm tra email có đang bị khóa do nhập sai OTP đăng ký quá nhiều lần hay không."""
        return OTPService.check_locked(RegisterService.PREFIX, email)

    @staticmethod
    def increment_register_otp_attempts(email: str):
        """Tăng số lần nhập sai OTP đăng ký cho email và trả về số lần thử sau khi tăng."""
        return OTPService.increment_attempts(RegisterService.PREFIX, email)

    @staticmethod
    def reset_register_otp_attempts(email: str):
        """Đặt lại số lần nhập sai OTP đăng ký cho email về 0 (gọi khi OTP được xác thực thành công)."""
        OTPService.reset_attempts(RegisterService.PREFIX, email)

    @staticmethod
    def lock_register_otp_for_email(email: str):
        """Khóa email khi người dùng nhập sai OTP đăng ký quá số lần cho phép."""
        OTPService.lock_email(RegisterService.PREFIX, email)

    @staticmethod
    def set_register_otp(email: str, code: str):
        """Lưu mã OTP đăng ký vào cache với thời gian hết hạn."""
        cache.set(RegisterService.get_register_otp_cache_key(email), code, OTP_EXPIRE_SECONDS)

    @staticmethod
    def get_register_otp(email: str):
        """Lấy mã OTP đăng ký từ cache."""
        return cache.get(RegisterService.get_register_otp_cache_key(email))

    @staticmethod
    def delete_register_otp(email: str):
        """Xóa mã OTP đăng ký khỏi cache (gọi khi OTP đã được sử dụng hoặc hết hạn)."""
        cache.delete(RegisterService.get_register_otp_cache_key(email))

    @staticmethod
    def set_register_data(email: str, data: dict):
        """Lưu tạm thông tin đăng ký người dùng vào cache trước khi xác thực OTP."""
        cache.set(RegisterService.get_register_data_cache_key(email), data, OTP_EXPIRE_SECONDS)

    @staticmethod
    def get_register_data(email: str):
        """Lấy thông tin đăng ký đã lưu trong cache."""
        return cache.get(RegisterService.get_register_data_cache_key(email))

    @staticmethod
    def delete_register_data(email: str):
        """Xóa thông tin đăng ký đã lưu trong cache (gọi khi đăng ký hoàn tất hoặc hết hạn)."""
        cache.delete(RegisterService.get_register_data_cache_key(email))

    @staticmethod
    def send_register_otp_email(email: str, code: str):
        """Gửi email chứa mã OTP xác thực đăng ký tài khoản."""
        subject = "Mã OTP đăng ký tài khoản"

        message = (
            f"Xin chào,\n\n"
            f"Bạn vừa yêu cầu đăng ký tài khoản LMS Learn.\n"
            f"Mã OTP của bạn là: {code}\n\n"
            f"Mã có hiệu lực trong {OTP_EXPIRE_SECONDS // 60} phút.\n\n"
            f"LSN Learn"
        )
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)

    @staticmethod
    def create_student_user(full_name: str, email: str, password: str):
        """Tạo tài khoản học viên mới với role STUDENT sau khi xác thực OTP thành công."""
        first_name, _, last_name = full_name.partition(" ")
        role = AuthRepository.get_or_create_role("STUDENT", "Student")
        return AuthRepository.create_user(
            email=email, password=password,
            first_name=first_name, last_name=last_name, role=role,
        )

    @staticmethod
    def send_register_otp(full_name, email, password):
        """
        Xử lý yêu cầu gửi mã OTP đăng ký.
        - Lưu thông tin đăng ký tạm thời vào cache
        - Tạo OTP, lưu vào cache và gửi email
        """
        email = email.lower()
        otp_code = OTPService.generate_otp_code()
        RegisterService.set_register_data(email, {"full_name": full_name, "email": email, "password": password})
        RegisterService.set_register_otp(email, otp_code)
        RegisterService.send_register_otp_email(email, otp_code)

    @staticmethod
    def verify_register_otp(email, otp):
        """
        Xác thực mã OTP đăng ký và tạo tài khoản nếu OTP hợp lệ.
        - Kiểm tra email không bị khóa
        - Kiểm tra OTP khớp với cache
        - Nếu sai quá 5 lần: khóa email
        - Nếu đúng: tạo user, xóa cache, trả về user
        """
        email = email.lower()

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
            register_data["full_name"], register_data["email"], register_data["password"]
        )
        RegisterService.delete_register_otp(email)
        RegisterService.delete_register_data(email)
        return user

    @staticmethod
    def resend_register_otp(email):
        """
        Xử lý yêu cầu gửi lại mã OTP đăng ký mới.
        - Kiểm tra email không bị khóa
        - Kiểm tra thông tin đăng ký còn hiệu lực
        - Tạo OTP mới và gửi email
        """
        email = email.lower()

        if RegisterService.check_register_otp_locked(email):
            raise ValidationError("Bạn đã nhập sai OTP quá nhiều lần. Vui lòng thử lại sau.")

        register_data = RegisterService.get_register_data(email)

        if not register_data:
            raise ValidationError("Thông tin đăng ký đã hết hạn. Vui lòng đăng ký lại.")

        otp = OTPService.generate_otp_code()
        RegisterService.set_register_otp(email, otp)
        RegisterService.send_register_otp_email(email, otp)
