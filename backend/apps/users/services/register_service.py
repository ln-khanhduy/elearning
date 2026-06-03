from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail

from apps.users.repositories.auth_repository import AuthRepository
from apps.users.services.otp_service import OTPService, OTP_EXPIRE_SECONDS


class RegisterService:
    PREFIX = "register"
    """
    Chức năng: Tạo key cache dùng để lưu mã OTP đăng ký theo email người dùng.
    Đầu vào: email (địa chỉ email đăng ký)
    Đầu ra: Chuỗi key cache có định dạng register_otp:<email>.
    """
    @staticmethod
    def get_register_otp_cache_key(email: str):
        return f"register_otp:{email.lower()}"
    """
    Chức năng: Tạo key cache dùng để lưu tạm thông tin đăng ký trước khi xác thực OTP.
    Đầu vào: email (địa chỉ email đăng ký)
    Đầu ra: Chuỗi key cache có định dạng register_data:<email>.
    """
    @staticmethod
    def get_register_data_cache_key(email: str):
        return f"register_data:{email.lower()}"
    """
    Chức năng: Kiểm tra email có đang bị khóa xác thực OTP hay không.
    Đầu vào: email (địa chỉ email cần kiểm tra)
    Đầu ra: True nếu email đang bị khóa, False nếu không bị khóa.
    """
    @staticmethod
    def check_register_otp_locked(email: str):
        return OTPService.check_locked(RegisterService.PREFIX, email)
    """
    Chức năng: Tăng số lần nhập sai OTP của email lên một đơn vị.
    Đầu vào: email (địa chỉ email cần ghi nhận số lần nhập sai)
    Đầu ra: Số lần nhập sai hiện tại hoặc trạng thái xử lý từ OTPService.
    """
    @staticmethod
    def increment_register_otp_attempts(email: str):
        return OTPService.increment_attempts(RegisterService.PREFIX, email)
    """
    Chức năng: Đặt lại số lần nhập sai OTP của email về 0.
    Đầu vào: email (địa chỉ email cần đặt lại)
    Đầu ra: Không có.
    """
    @staticmethod
    def reset_register_otp_attempts(email: str):
        OTPService.reset_attempts(RegisterService.PREFIX, email)
    """
    Chức năng: Khóa xác thực OTP đối với email khi vượt quá số lần nhập sai cho phép.
    Đầu vào: email (địa chỉ email cần khóa)
    Đầu ra: Không có.
    """
    @staticmethod
    def lock_register_otp_for_email(email: str):
        OTPService.lock_email(RegisterService.PREFIX, email)
    """
    Chức năng: Lưu mã OTP đăng ký vào cache với thời gian hết hạn xác định.
    Đầu vào: email (địa chỉ email đăng ký), code (mã OTP)
    Đầu ra: Không có.
    """
    @staticmethod
    def set_register_otp(email: str, code: str):
        cache.set(RegisterService.get_register_otp_cache_key(email),code,OTP_EXPIRE_SECONDS,)
    """
    Chức năng: Lấy mã OTP đăng ký từ cache.
    Đầu vào: email (địa chỉ email đăng ký)
    Đầu ra: Mã OTP nếu tồn tại, ngược lại trả về None.
    """
    @staticmethod
    def get_register_otp(email: str):
        return cache.get(RegisterService.get_register_otp_cache_key(email))
    """
    Chức năng: Xóa mã OTP đăng ký khỏi cache.
    Đầu vào: email (địa chỉ email đăng ký)
    Đầu ra: Không có.
    """
    @staticmethod
    def delete_register_otp(email: str):
        cache.delete(RegisterService.get_register_otp_cache_key(email))
    """
    Chức năng: Lưu tạm thông tin đăng ký người dùng vào cache trước khi xác thực OTP.
    Đầu vào: email (địa chỉ email đăng ký), data (thông tin đăng ký của người dùng)
    Đầu ra: Không có.
    """
    @staticmethod
    def set_register_data(email: str, data: dict):
        cache.set(RegisterService.get_register_data_cache_key(email), data,OTP_EXPIRE_SECONDS,)
    """
    Chức năng: Lấy thông tin đăng ký đã lưu trong cache.
    Đầu vào: email (địa chỉ email đăng ký)
    Đầu ra: Thông tin đăng ký dưới dạng dictionary hoặc None nếu không tồn tại.
    """
    @staticmethod
    def get_register_data(email: str):
        return cache.get(RegisterService.get_register_data_cache_key(email))
    """
    Chức năng: Xóa thông tin đăng ký đã lưu trong cache.
    Đầu vào: email (địa chỉ email đăng ký)
    Đầu ra: Không có.
    """
    @staticmethod
    def delete_register_data(email: str):
        cache.delete(RegisterService.get_register_data_cache_key(email))
    """
    Chức năng: Gửi email chứa mã OTP để xác thực đăng ký tài khoản.
    Đầu vào: email (địa chỉ email người nhận), code (mã OTP)
    Đầu ra: Không có, nhưng hệ thống sẽ gửi email đến người dùng.
    """
    @staticmethod
    def send_register_otp_email(email: str, code: str):
        subject = "Mã OTP đăng ký tài khoản"

        message = (
            f"Xin chào,\n\n"
            f"Bạn vừa yêu cầu đăng ký tài khoản LMS Learn.\n"
            f"Mã OTP của bạn là: {code}\n\n"
            f"Mã có hiệu lực trong {OTP_EXPIRE_SECONDS // 60} phút.\n\n"
            f"LSN Learn"
        )
        send_mail(subject, message,settings.DEFAULT_FROM_EMAIL,[email],fail_silently=False,)
    """
    Chức năng: Tạo mới tài khoản học viên sau khi xác thực OTP thành công.
    Đầu vào:
        - full_name: Họ và tên người dùng.
        - email: Địa chỉ email đăng ký.
        - password: Mật khẩu tài khoản.
    Đầu ra: Đối tượng User vừa được tạo trong hệ thống.
    """
    @staticmethod
    def create_student_user(full_name: str, email: str, password: str):
        first_name, _, last_name = full_name.partition(" ")
        role = AuthRepository.get_or_create_role("STUDENT", "Student")
        return AuthRepository.create_user(username=email, email=email,password=password,first_name=first_name,last_name=last_name,role=role,)