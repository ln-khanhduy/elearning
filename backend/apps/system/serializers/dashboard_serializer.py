from rest_framework import serializers


class DashboardStatsSerializer(serializers.Serializer):
    key = serializers.CharField()
    label = serializers.CharField()
    value = serializers.IntegerField()


class UsersByMonthSerializer(serializers.Serializer):
    month = serializers.IntegerField()
    label = serializers.CharField()
    total = serializers.IntegerField()


class UsersByRoleSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    code = serializers.CharField()
    name = serializers.CharField()
    total = serializers.IntegerField()


class CoursesByStatusSerializer(serializers.Serializer):
    status = serializers.CharField()
    total = serializers.IntegerField()


class RevenueByYearSerializer(serializers.Serializer):
    year = serializers.IntegerField()
    total = serializers.FloatField()


class ActivitySerializer(serializers.Serializer):
    time = serializers.DateTimeField()
    event = serializers.CharField()
    source = serializers.CharField()
    status = serializers.CharField()
    detail = serializers.CharField()


class DashboardDataSerializer(serializers.Serializer):
    stats = DashboardStatsSerializer(many=True)
    users_by_month = UsersByMonthSerializer(many=True)
    users_by_role = UsersByRoleSerializer(many=True)
    courses_by_status = CoursesByStatusSerializer(many=True)
    pending_instructor_applications = serializers.IntegerField()
    revenue_by_year = RevenueByYearSerializer(many=True)
    activities = ActivitySerializer(many=True)
