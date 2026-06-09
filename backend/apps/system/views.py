from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.system.serializers.dashboard_serializer import DashboardDataSerializer
from apps.system.services.dashboard_service import AdminDashboardService


class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Chỉ SUPERADMIN mới được xem dashboard
        if request.user.role.code != "SUPERADMIN":
            return Response(
                {"detail": "Bạn không có quyền truy cập trang này."},
                status=status.HTTP_403_FORBIDDEN,
            )

        year = request.query_params.get("year")
        if year:
            try:
                year = int(year)
            except (ValueError, TypeError):
                year = None

        data = AdminDashboardService.get_dashboard_data(year)
        serializer = DashboardDataSerializer(data)

        return Response(serializer.data)
