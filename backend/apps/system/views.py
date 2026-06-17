from rest_framework import status
from rest_framework.response import Response

from apps.common.base_api_view import BasePermissionAPIView
from apps.system.services.admin_log_service import AdminLogService

from apps.system.serializers.dashboard_serializer import DashboardDataSerializer
from apps.system.services.dashboard_service import AdminDashboardService



class AdminDashboardView(BasePermissionAPIView):
    """
    GET /api/dashboard/ - Lấy dữ liệu thống kê cho trang dashboard admin.
    Yêu cầu quyền: admin.dashboard.view
    Có thể lọc theo năm: ?year=2026
    """
    required_permission = "admin.dashboard.view"

    def get(self, request):
        year = request.query_params.get("year")
        if year:
            try:
                year = int(year)
            except (ValueError, TypeError):
                year = None

        data = AdminDashboardService.get_dashboard_data(year)
        serializer = DashboardDataSerializer(data)

        AdminLogService.log(
            admin=request.user,
            action_type='DASHBOARD_VIEW',
            detail=f"Admin {request.user.email} đã xem dashboard (năm: {year or 'tất cả'})",
        )


        return Response(serializer.data)


