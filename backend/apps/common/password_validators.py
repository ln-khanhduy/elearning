import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class VietnameseMinimumLengthValidator:
    """Validator kiểm tra độ dài tối thiểu của mật khẩu - thông báo bằng tiếng Việt."""

    def __init__(self, min_length=6):
        self.min_length = min_length

    def validate(self, password, user=None):
        if len(password) < self.min_length:
            raise ValidationError(
                _(f"Mật khẩu phải có ít nhất {self.min_length} ký tự."),
                code="password_too_short",
                params={"min_length": self.min_length},
            )

    def get_help_text(self):
        return _(f"Mật khẩu phải có ít nhất {self.min_length} ký tự.")


class VietnameseCommonPasswordValidator:
    """Validator kiểm tra mật khẩu có quá phổ biến hay không - thông báo bằng tiếng Việt."""

    def validate(self, password, user=None):
        # Danh sách các mật khẩu phổ biến (top 100)
        common_passwords = [
            "password", "123456", "12345678", "qwerty", "abc123", "monkey",
            "1234567", "letmein", "trustno1", "dragon", "baseball", "iloveyou",
            "master", "sunshine", "welcome", "shadow", "ashley", "football",
            "jesus", "michael", "ninja", "mustang", "password1", "admin",
            "123456789", "1234567890", "123123", "1234", "12345", "passw0rd",
            "qwerty123", "qwertyuiop", "asdfgh", "zxcvbnm", "111111", "000000",
            "121212", "654321", "555555", "777777", "888888", "999999",
            "123321", "112233", "123qwe", "qwe123", "1q2w3e", "qwerty12345",
        ]

        if password.lower() in common_passwords:
            raise ValidationError(
                _("Mật khẩu này quá phổ biến, vui lòng chọn mật khẩu khác."),
                code="password_too_common",
            )

    def get_help_text(self):
        return _("Mật khẩu không được quá phổ biến.")


class VietnameseNumericPasswordValidator:
    """Validator kiểm tra mật khẩu không được chỉ toàn số - thông báo bằng tiếng Việt."""

    def validate(self, password, user=None):
        if password.isdigit():
            raise ValidationError(
                _("Mật khẩu không được chỉ chứa toàn số."),
                code="password_entirely_numeric",
            )

    def get_help_text(self):
        return _("Mật khẩu không được chỉ chứa toàn số.")


class VietnameseUserAttributeSimilarityValidator:
    """Validator kiểm tra mật khẩu không được quá giống với thông tin cá nhân - thông báo bằng tiếng Việt."""

    def __init__(self, max_similarity=0.7):
        self.max_similarity = max_similarity

    def validate(self, password, user=None):
        if user is None:
            return

        user_attributes = []
        if hasattr(user, "email") and user.email:
            user_attributes.append(user.email)
        if hasattr(user, "first_name") and user.first_name:
            user_attributes.append(user.first_name)
        if hasattr(user, "last_name") and user.last_name:
            user_attributes.append(user.last_name)

        password_lower = password.lower()

        for attribute in user_attributes:
            if not attribute:
                continue
            attribute_lower = attribute.lower()

            # Kiểm tra nếu mật khẩu chứa thông tin cá nhân
            if attribute_lower and len(attribute_lower) >= 3:
                if attribute_lower in password_lower or password_lower in attribute_lower:
                    raise ValidationError(
                        _("Mật khẩu quá giống với thông tin cá nhân của bạn."),
                        code="password_too_similar",
                    )

    def get_help_text(self):
        return _("Mật khẩu không được quá giống với thông tin cá nhân của bạn.")
