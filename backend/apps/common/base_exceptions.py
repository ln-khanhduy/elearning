"""Base exception classes cho API."""
from rest_framework.exceptions import APIException

class AppException(APIException):
    """Base exception cho ứng dụng với status_code và detail tùy chỉnh."""
    status_code = 400
    default_detail = "Lỗi hệ thống."
    default_code = "error"

    def __init__(self, detail=None, code=None, status_code=None):
        if status_code:
            self.status_code = status_code
        super().__init__(detail, code)

class NotFoundException(AppException):
    status_code = 404
    default_detail = "Không tìm thấy tài nguyên."

class PermissionDeniedException(AppException):
    status_code = 403
    default_detail = "Bạn không có quyền thực hiện hành động này."

class ValidationException(AppException):
    status_code = 400
    default_detail = "Dữ liệu không hợp lệ."
