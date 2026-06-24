from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth, TruncYear
from django.utils import timezone

from apps.users.models import User, Role, InstructorProfile
from apps.courses.models import Course
from apps.payments.models import PaymentTransaction
from apps.payments.models import PaymentTransaction as PaymentTransactionModel


class AdminDashboardRepository:
    @staticmethod
    def count_users():
        """Đếm tổng số người dùng trong hệ thống."""
        return User.objects.count()

    @staticmethod
    def count_admins():
        """Đếm số lượng admin (tất cả role không phải STUDENT và INSTRUCTOR)."""
        return User.objects.exclude(role__code__in=["STUDENT", "INSTRUCTOR"]).count()

    @staticmethod
    def count_instructors():
        """Đếm số lượng giảng viên (role INSTRUCTOR)."""
        return User.objects.filter(role__code="INSTRUCTOR").count()

    @staticmethod
    def count_students():
        """Đếm số lượng học viên (role STUDENT)."""
        return User.objects.filter(role__code="STUDENT").count()

    @staticmethod
    def count_courses():
        """Đếm tổng số khóa học trong hệ thống."""
        return Course.objects.count()

    @staticmethod
    def get_users_by_role():
        """Lấy số lượng người dùng nhóm theo từng role."""
        return (
            Role.objects
            .annotate(total=Count("user"))
            .values("id", "code", "name", "total")
            .order_by("id")
        )

    @staticmethod
    def get_new_users_by_month(year=None):
        """Lấy số lượng người dùng mới đăng ký theo từng tháng trong một năm."""
        if year is None:
            year = timezone.now().year

        return (
            User.objects
            .filter(date_joined__year=year)
            .annotate(month=TruncMonth("date_joined"))
            .values("month")
            .annotate(total=Count("id"))
            .order_by("month")
        )

    @staticmethod
    def get_courses_by_status():
        """Lấy số lượng khóa học nhóm theo trạng thái (draft, pending, approved, rejected, published)."""
        return (
            Course.objects
            .values("status")
            .annotate(total=Count("id"))
            .order_by("status")
        )

    @staticmethod
    def count_pending_instructor_applications():
        """Đếm số lượng hồ sơ đăng ký giảng viên đang chờ duyệt."""
        return InstructorProfile.objects.filter(status=InstructorProfile.Status.PENDING).count()

    @staticmethod
    def get_total_revenue():
        """Tính tổng doanh thu từ tất cả giao dịch đã thanh toán (PAID, HOLD)."""
        result = PaymentTransaction.objects.filter(
            status__in=[PaymentTransactionModel.Status.PAID, PaymentTransactionModel.Status.HOLD]
        ).aggregate(total=Sum("net_amount"))
        return result["total"] or 0

    @staticmethod
    def get_revenue_by_year():
        """Lấy doanh thu theo từng năm từ các giao dịch đã thanh toán."""
        return (
            PaymentTransaction.objects
            .filter(status__in=[PaymentTransactionModel.Status.PAID, PaymentTransactionModel.Status.HOLD])
            .annotate(year=TruncYear("paid_at"))
            .values("year")
            .annotate(total=Sum("net_amount"))
            .order_by("year")
        )

    @staticmethod
    def get_recent_users(limit=5):
        """Lấy danh sách người dùng mới nhất, kèm thông tin role."""
        return User.objects.select_related("role").order_by("-date_joined")[:limit]

    @staticmethod
    def get_recent_courses(limit=5):
        """Lấy danh sách khóa học mới nhất, kèm thông tin created_by và assigned_instructor."""
        return Course.objects.select_related("created_by", "assigned_instructor").order_by("-created_at")[:limit]

    @staticmethod
    def get_recent_instructor_applications(limit=5):
        """Lấy danh sách hồ sơ đăng ký giảng viên mới nhất, kèm thông tin user và người duyệt."""
        return (
            InstructorProfile.objects
            .select_related("user", "reviewed_by")
            .order_by("-created_at")[:limit]
        )
