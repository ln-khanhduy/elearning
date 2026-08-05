from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from rest_framework.exceptions import ValidationError

from apps.users.repositories import auth_repository
from apps.users.services import otp_service


PREFIX = "register"


def get_register_otp_cache_key(email: str):
    """Lấy key cache lưu mã OTP đăng ký tài khoản của email."""
    return f"register_otp:{email.lower()}"


def get_register_data_cache_key(email: str):
    """Lấy key cache lưu thông tin đăng ký tạm thời của email."""
    return f"register_data:{email.lower()}"


def check_register_otp_locked(email: str):
    """Kiểm tra email có bị khóa tạm thời do nhập sai OTP đăng ký quá số lần cho phép hay không."""
    return otp_service.check_locked(PREFIX, email)


def increment_register_otp_attempts(email: str):
    """Tăng số lần nhập sai OTP đăng ký của email lên 1."""
    return otp_service.increment_attempts(PREFIX, email)


def reset_register_otp_attempts(email: str):
    """Đặt lại số lần nhập sai OTP đăng ký của email về 0."""
    otp_service.reset_attempts(PREFIX, email)


def lock_register_otp_for_email(email: str):
    """Khóa tạm thời email do nhập sai OTP đăng ký quá số lần cho phép."""
    otp_service.lock_email(PREFIX, email)


def set_register_otp(email: str, code: str):
    """Lưu mã OTP đăng ký của email vào cache với thời hạn hiệu lực."""
    cache.set(get_register_otp_cache_key(email), code, otp_service.OTP_EXPIRE_SECONDS)


def get_register_otp(email: str):
    """Lấy mã OTP đăng ký hiện tại của email từ cache."""
    return cache.get(get_register_otp_cache_key(email))


def delete_register_otp(email: str):
    """Xóa mã OTP đăng ký của email khỏi cache."""
    cache.delete(get_register_otp_cache_key(email))


def set_register_data(email: str, data: dict):
    """Lưu thông tin đăng ký tạm thời của email vào cache."""
    cache.set(get_register_data_cache_key(email), data, otp_service.OTP_EXPIRE_SECONDS)


def get_register_data(email: str):
    """Lấy thông tin đăng ký tạm thời của email từ cache."""
    return cache.get(get_register_data_cache_key(email))


def delete_register_data(email: str):
    """Xóa thông tin đăng ký tạm thời của email khỏi cache."""
    cache.delete(get_register_data_cache_key(email))


def send_register_otp_email(email: str, code: str):
    """Gửi email chứa mã OTP đăng ký tài khoản cho người dùng."""
    subject = "Mã OTP đăng ký tài khoản"
    message = (
        f"Xin chào,\n\n"
        f"Bạn vừa yêu cầu đăng ký tài khoản LMS Learn.\n"
        f"Mã OTP của bạn là: {code}\n\n"
        f"Mã có hiệu lực trong {otp_service.OTP_EXPIRE_SECONDS // 60} phút.\n\n"
        f"LSN Learn"
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)


def create_student_user(full_name: str, email: str, password: str):
    """Tạo mới tài khoản học viên (role STUDENT) từ họ tên, email và mật khẩu."""
    first_name, _, last_name = full_name.partition(" ")
    role = auth_repository.get_or_create_role("STUDENT", "Student")
    return auth_repository.create_user(
        email=email, password=password,
        first_name=first_name, last_name=last_name, role=role,
    )


def send_register_otp(full_name, email, password):
    """Gửi mã OTP đăng ký tài khoản.

    - Lưu thông tin đăng ký tạm thời và mã OTP vào cache.
    - Gửi mã OTP qua email cho người dùng.
    """
    email = email.lower()
    otp_code = otp_service.generate_otp_code()
    set_register_data(email, {"full_name": full_name, "email": email, "password": password})
    set_register_otp(email, otp_code)
    send_register_otp_email(email, otp_code)


def verify_register_otp(email, otp):
    """Xác minh mã OTP đăng ký và tạo tài khoản học viên nếu hợp lệ.

    - Nếu OTP sai, tăng số lần thử và khóa email tạm thời khi sai quá 5 lần.
    - Nếu OTP đúng: kiểm tra thông tin đăng ký còn hiệu lực và email chưa được sử dụng,
      sau đó tạo tài khoản học viên và xóa dữ liệu tạm.
    """
    email = email.lower()

    if check_register_otp_locked(email):
        raise ValidationError("Bạn đã nhập sai OTP quá 5 lần. Vui lòng thử lại sau 30 phút.")

    stored_otp = get_register_otp(email)
    if not stored_otp or stored_otp != otp:
        attempts = increment_register_otp_attempts(email)
        if attempts >= 5:
            lock_register_otp_for_email(email)
            raise ValidationError(f"OTP sai {attempts} lần. Tài khoản tạm khóa 30 phút.")
        raise ValidationError(f"OTP không đúng. Bạn còn {5 - attempts} lần thử.")

    reset_register_otp_attempts(email)
    register_data = get_register_data(email)

    if not register_data:
        raise ValidationError("Thông tin đăng ký đã hết hạn.")
    if auth_repository.get_user_by_email(email):
        raise ValidationError("Email đã được sử dụng.")

    user = create_student_user(
        register_data["full_name"], register_data["email"], register_data["password"]
    )
    delete_register_otp(email)
    delete_register_data(email)
    return user


def resend_register_otp(email):
    """Gửi lại mã OTP đăng ký cho email.

    - Kiểm tra email chưa bị khóa và thông tin đăng ký còn hiệu lực.
    - Sinh mã OTP mới, lưu lại và gửi qua email.
    """
    email = email.lower()

    if check_register_otp_locked(email):
        raise ValidationError("Bạn đã nhập sai OTP quá nhiều lần. Vui lòng thử lại sau.")

    register_data = get_register_data(email)
    if not register_data:
        raise ValidationError("Thông tin đăng ký đã hết hạn. Vui lòng đăng ký lại.")

    otp = otp_service.generate_otp_code()
    set_register_otp(email, otp)
    send_register_otp_email(email, otp)