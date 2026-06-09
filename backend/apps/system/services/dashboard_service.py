from django.utils import timezone
from django.db.models import Sum
from django.db.models.functions import TruncYear

from apps.system.repositories.dashboard_repository import AdminDashboardRepository
from apps.payments.models import PaymentTransaction


class AdminDashboardService:
    @staticmethod
    def get_monthly_data(queryset_result):
        months = {i: 0 for i in range(1, 13)}

        for item in queryset_result:
            if item["month"]:
                months[item["month"].month] = item["total"]

        return [
            {
                "month": month,
                "label": f"T{month}",
                "total": total,
            }
            for month, total in months.items()
        ]

    @staticmethod
    def get_total_revenue():
        result = PaymentTransaction.objects.filter(
            status__in=["PAID", "HOLD"]
        ).aggregate(total=Sum("net_amount"))

        return result["total"] or 0

    @staticmethod
    def get_revenue_by_year():
        """Lấy doanh thu theo từng năm từ các giao dịch đã thanh toán."""
        revenues = (
            PaymentTransaction.objects
            .filter(status__in=["PAID", "HOLD"])
            .annotate(year=TruncYear("paid_at"))
            .values("year")
            .annotate(total=Sum("net_amount"))
            .order_by("year")
        )

        revenue_map = {}
        for item in revenues:
            if item["year"]:
                revenue_map[item["year"].year] = float(item["total"] or 0)

        current_year = timezone.now().year
        result = []
        for year in range(2019, current_year + 1):
            result.append({
                "year": year,
                "total": revenue_map.get(year, 0),
            })

        return result

    @staticmethod
    def get_dashboard_data(year=None):
        if year is None:
            year = timezone.now().year

        users_by_month = AdminDashboardService.get_monthly_data(
            AdminDashboardRepository.get_new_users_by_month(year)
        )

        users_by_role = list(AdminDashboardRepository.get_users_by_role())
        courses_by_status = list(AdminDashboardRepository.get_courses_by_status())

        recent_activities = []

        for user in AdminDashboardRepository.get_recent_users():
            recent_activities.append({
                "time": user.date_joined,
                "event": "USER_CREATED",
                "source": "USER_MODULE",
                "status": "SUCCESS",
                "detail": f"Tài khoản {user.email} vừa được tạo.",
            })

        for course in AdminDashboardRepository.get_recent_courses():
            recent_activities.append({
                "time": course.created_at,
                "event": "COURSE_CREATED",
                "source": "COURSE_MODULE",
                "status": "SUCCESS",
                "detail": f"Khóa học {course.title} vừa được tạo.",
            })

        for application in AdminDashboardRepository.get_recent_instructor_applications():
            recent_activities.append({
                "time": application.created_at,
                "event": "INSTRUCTOR_APPLICATION",
                "source": "INSTRUCTOR_MODULE",
                "status": application.status,
                "detail": f"{application.user.email} đã gửi hồ sơ giảng viên.",
            })

        recent_activities = sorted(
            recent_activities,
            key=lambda item: item["time"],
            reverse=True
        )[:8]

        return {
            "stats": [
                {
                    "key": "total_users",
                    "label": "Tổng người dùng",
                    "value": AdminDashboardRepository.count_users(),
                },
                {
                    "key": "total_admins",
                    "label": "Tổng admin",
                    "value": AdminDashboardRepository.count_admins(),
                },
                {
                    "key": "total_instructors",
                    "label": "Tổng giảng viên",
                    "value": AdminDashboardRepository.count_instructors(),
                },
                {
                    "key": "total_students",
                    "label": "Tổng học viên",
                    "value": AdminDashboardRepository.count_students(),
                },
                {
                    "key": "total_courses",
                    "label": "Tổng khóa học",
                    "value": AdminDashboardRepository.count_courses(),
                },
                {
                    "key": "total_revenue",
                    "label": "Doanh thu hệ thống",
                    "value": AdminDashboardService.get_total_revenue(),
                },
            ],
            "users_by_month": users_by_month,
            "users_by_role": users_by_role,
            "courses_by_status": courses_by_status,
            "pending_instructor_applications": AdminDashboardRepository.count_pending_instructor_applications(),
            "revenue_by_year": AdminDashboardService.get_revenue_by_year(),
            "activities": recent_activities,
        }
