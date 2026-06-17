from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from apps.certificates.models import CourseCertificate
from apps.certificates.serializers import CourseCertificateSerializer


def success_response(data=None, message="Success", http_status=status.HTTP_200_OK):
    return Response({
        "success": True,
        "message": message,
        "data": data,
    }, status=http_status)


def error_response(message="Error", errors=None, http_status=status.HTTP_400_BAD_REQUEST):
    return Response({
        "success": False,
        "message": message,
        "errors": errors or {},
    }, status=http_status)


class MyCertificatesAPIView(APIView):
    """
    GET /api/certificates/my-certificates/
    Lấy danh sách chứng chỉ của user hiện tại.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        certificates = CourseCertificate.objects.filter(
            student=request.user
        ).select_related("course", "enrollment").order_by("-issued_at")

        serializer = CourseCertificateSerializer(certificates, many=True)
        return success_response(serializer.data, "Lấy danh sách chứng chỉ thành công.")
