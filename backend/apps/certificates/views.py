from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from apps.certificates.models import CourseCertificate
from apps.certificates.serializers import CourseCertificateSerializer
from apps.common.response_helpers import success_response, error_response


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
