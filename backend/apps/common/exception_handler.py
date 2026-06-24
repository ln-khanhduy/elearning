"""
Custom exception handler cho Django REST Framework.
Tự động dịch error messages sang tiếng Việt.
"""

from rest_framework.views import exception_handler
from apps.common.vi_error_messages import VI_ERROR_MESSAGES
import re


def translate_error_message(message):
    """Dịch error message từ tiếng Anh sang tiếng Việt."""
    if isinstance(message, str):
        # Thử match chính xác trước
        if message in VI_ERROR_MESSAGES:
            return VI_ERROR_MESSAGES[message]

        # Thử match với pattern có chứa tham số
        for eng_msg, vi_msg in VI_ERROR_MESSAGES.items():
            # Chuyển pattern {param} thành regex group
            pattern = re.escape(eng_msg)
            pattern = re.sub(r'\\\{(\w+)\}', r'(?P<\1>.+?)', pattern)
            match = re.match(pattern, message)
            if match:
                return vi_msg.format(**match.groupdict())

    return message


def translate_errors(errors):
    """Dịch tất cả error messages trong dict/list."""
    if isinstance(errors, dict):
        return {key: translate_errors(value) for key, value in errors.items()}
    elif isinstance(errors, list):
        return [translate_errors(item) for item in errors]
    elif isinstance(errors, str):
        return translate_error_message(errors)
    return errors


def custom_exception_handler(exc, context):
    """
    Custom exception handler để dịch error messages sang tiếng Việt.
    """
    response = exception_handler(exc, context)

    if response is not None and response.data:
        response.data = translate_errors(response.data)

    return response
