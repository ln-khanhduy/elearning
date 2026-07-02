from rest_framework.response import Response
from rest_framework import status


def success_response(data=None, message="Success", http_status=status.HTTP_200_OK):
    """Trả về response thành công với định dạng thống nhất: {success, message, data}."""
    return Response({
        "success": True,
        "message": message,
        "data": data,
    }, status=http_status)


def error_response(message="Error", errors=None, http_status=status.HTTP_400_BAD_REQUEST):
    """Trả về response lỗi với định dạng thống nhất: {success, message, errors}."""
    return Response({
        "success": False,
        "message": message,
        "errors": errors or {},
    }, status=http_status)