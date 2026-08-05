from django.conf import settings
from django.core import signing
from django.core.cache import cache
from django.core.mail import send_mail
from rest_framework.exceptions import ValidationError

from apps.users.services import otp_service
from apps.users.repositories import auth_repository


RESET_TOKEN_EXPIRE_SECONDS = 60 * 30
PREFIX = "password_reset"


def get_otp_cache_key(email: str):
    """Lấy key cache lưu mã OTP đặt lại mật khẩu của email."""
    return f"password_reset_otp:{email.lower()}"


def get_reset_token_cache_key(token: str):
    """Lấy key cache lưu trạng thái token đặt lại mật khẩu (đã sử dụng hay chưa)."""
    return f"password_reset_token:{token}"


def check_otp_locked(email: str):
    """Kiểm tra email có bị khóa tạm thời do nhập sai OTP quá số lần cho phép hay không."""
    return otp_service.check_locked(PREFIX, email)


def increment_otp_attempts(email: str):
    """Tăng số lần nhập sai OTP của email lên 1."""
    return otp_service.increment_attempts(PREFIX, email)


def reset_otp_attempts(email: str):
    """Đặt lại số lần nhập sai OTP của email về 0."""
    otp_service.reset_attempts(PREFIX, email)


def lock_otp_for_email(email: str):
    """Khóa tạm thời email do nhập sai OTP quá số lần cho phép."""
    otp_service.lock_email(PREFIX, email)


def set_otp_code(email: str, code: str):
    """Lưu mã OTP của email vào cache với thời hạn hiệu lực."""
    cache.set(get_otp_cache_key(email), code, otp_service.OTP_EXPIRE_SECONDS)


def get_otp_code(email: str):
    """Lấy mã OTP hiện tại của email từ cache."""
    return cache.get(get_otp_cache_key(email))


def delete_otp_code(email: str):
    """Xóa mã OTP của email khỏi cache."""
    cache.delete(get_otp_cache_key(email))


def get_password_reset_token(email: str):
    """Tạo token đặt lại mật khẩu (có chữ ký thời gian) cho email."""
    signer = signing.TimestampSigner(salt="password-reset")
    return signer.sign(email.lower())


def verify_password_reset_token(token: str):
    """Xác minh token đặt lại mật khẩu và trả về email.

    Ném lỗi BadSignature hoặc SignatureExpired nếu token không hợp lệ hoặc hết hạn.
    """
    signer = signing.TimestampSigner(salt="password-reset")
    return signer.unsign(token, max_age=RESET_TOKEN_EXPIRE_SECONDS)


def is_reset_token_used(token: str):
    """Kiểm tra token đặt lại mật khẩu đã được sử dụng hay chưa."""
    return cache.get(get_reset_token_cache_key(token)) is not None


def mark_reset_token_used(token: str):
    """Đánh dấu token đặt lại mật khẩu là đã được sử dụng."""
    cache.set(get_reset_token_cache_key(token), True, RESET_TOKEN_EXPIRE_SECONDS)


def send_password_reset_email(email: str, code: str):
    """Gửi email chứa mã OTP khôi phục mật khẩu cho người dùng."""
    subject = "Mã OTP khôi phục mật khẩu"
    message = (
        f"Xin chào,\n\n"
        f"Bạn vừa yêu cầu khôi phục mật khẩu.\n"
        f"Mã OTP của bạn là: {code}\n\n"
        f"Mã có hiệu lực trong {otp_service.OTP_EXPIRE_SECONDS // 60} phút. "
        f"Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.\n\n"
        f"LSN Learn"
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)


def send_reset_otp(email):
    """Gửi mã OTP đặt lại mật khẩu đến email của người dùng.

    - Nếu email đang bị khóa do nhập sai OTP quá 5 lần, báo lỗi ValidationError.
    - Sinh mã OTP mới, lưu vào cache và gửi qua email.
    """
    email = email.lower()
    if check_otp_locked(email):
        raise ValidationError("Email này đã bị khóa tạm thời do nhập sai OTP quá 5 lần. Vui lòng thử lại trong 30 phút.")
    otp_code = otp_service.generate_otp_code()
    set_otp_code(email, otp_code)
    send_password_reset_email(email, otp_code)


def verify_otp_and_create_token(email, otp):
    """Xác minh mã OTP và tạo token đặt lại mật khẩu nếu hợp lệ.

    - Nếu OTP sai, tăng số lần thử và khóa email tạm thời khi sai quá 5 lần.
    - Nếu OTP đúng, xóa mã, đặt lại số lần thử và trả về token đặt lại mật khẩu.
    """
    email = email.lower()
    if check_otp_locked(email):
        raise ValidationError("Bạn đã nhập sai OTP quá 5 lần. Vui lòng thử lại trong 30 phút.")

    stored_otp = get_otp_code(email)
    if not stored_otp or stored_otp != otp:
        attempts = increment_otp_attempts(email)
        if attempts >= 5:
            lock_otp_for_email(email)
            raise ValidationError(f"Mã OTP sai. Bạn đã nhập sai {attempts} lần. Tài khoản sẽ bị khóa 30 phút.")
        raise ValidationError(f"Mã OTP không đúng. Bạn còn {5 - attempts} lần thử.")

    delete_otp_code(email)
    reset_otp_attempts(email)
    return get_password_reset_token(email)


def reset_password(token, password):
    """Đặt lại mật khẩu cho người dùng dựa trên token hợp lệ.

    - Xác minh token (kiểm tra hợp lệ, hết hạn và chưa được sử dụng).
    - Tìm người dùng theo email trong token, cập nhật mật khẩu mới.
    - Đánh dấu token là đã sử dụng để tránh dùng lại.
    """
    if not token or not token.strip():
        raise ValidationError("Token không hợp lệ.")

    try:
        email = verify_password_reset_token(token)
    except signing.BadSignature:
        raise ValidationError("Yêu cầu đặt lại mật khẩu không hợp lệ.")
    except signing.SignatureExpired:
        raise ValidationError("Yêu cầu đặt lại mật khẩu đã hết hạn.")

    if is_reset_token_used(token):
        raise ValidationError("Yêu cầu đặt lại mật khẩu đã được sử dụng.")

    user = auth_repository.get_user_by_email(email)
    if not user:
        raise ValidationError("Không tìm thấy tài khoản liên quan đến yêu cầu này.")

    user.set_password(password)
    user.save(update_fields=["password"])
    mark_reset_token_used(token)
    return user