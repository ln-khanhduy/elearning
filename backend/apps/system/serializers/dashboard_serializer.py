from rest_framework import serializers


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer cho một thống kê tổng quan - gồm key định danh, label hiển thị và giá trị."""

    key = serializers.CharField()
    label = serializers.CharField()
    value = serializers.FloatField()


class UsersByMonthSerializer(serializers.Serializer):
    """Serializer cho thống kê người dùng theo tháng - gồm tháng, label và tổng số."""

    month = serializers.IntegerField()
    label = serializers.CharField()
    total = serializers.IntegerField()


class UsersByRoleSerializer(serializers.Serializer):
    """Serializer cho thống kê người dùng theo role - gồm id, code, name và tổng số."""

    id = serializers.IntegerField()
    code = serializers.CharField()
    name = serializers.CharField()
    total = serializers.IntegerField()


class CoursesByStatusSerializer(serializers.Serializer):
    """Serializer cho thống kê khóa học theo trạng thái - gồm status và tổng số."""

    status = serializers.CharField()
    total = serializers.IntegerField()


class RevenueByYearSerializer(serializers.Serializer):
    """Serializer cho thống kê doanh thu theo năm - gồm năm và tổng doanh thu."""

    year = serializers.IntegerField()
    total = serializers.FloatField()


class ActivitySerializer(serializers.Serializer):
    """Serializer cho một hoạt động gần đây - gồm thời gian, sự kiện, nguồn, trạng thái và chi tiết."""

    time = serializers.DateTimeField()
    event = serializers.CharField()
    source = serializers.CharField()
    status = serializers.CharField()
    detail = serializers.CharField()


class DashboardDataSerializer(serializers.Serializer):
    """Serializer tổng hợp dữ liệu dashboard - bao gồm tất cả thống kê, biểu đồ và hoạt động gần đây."""

    stats = DashboardStatsSerializer(many=True)
    users_by_month = UsersByMonthSerializer(many=True)
    users_by_role = UsersByRoleSerializer(many=True)
    courses_by_status = CoursesByStatusSerializer(many=True)
    pending_instructor_applications = serializers.IntegerField()
    revenue_by_year = RevenueByYearSerializer(many=True)
    revenue_change = serializers.FloatField(allow_null=True)
    revenue_today = serializers.FloatField()
    revenue_this_week = serializers.FloatField()
    activities = ActivitySerializer(many=True)
    top_courses = serializers.ListField(child=serializers.DictField(), required=False, default=[])
    recent_enrollments = serializers.ListField(child=serializers.DictField(), required=False, default=[])
