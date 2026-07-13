from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth, TruncYear
from django.utils import timezone

from apps.users.models import User, Role, InstructorProfile
from apps.courses.models import Course
from apps.payments.models import PaymentTransaction
from apps.payments.models import PaymentTransaction as PaymentTransactionModel


def count_users():
    return User.objects.count()


def count_admins():
    return User.objects.exclude(role__code__in=["STUDENT", "INSTRUCTOR"]).count()


def count_instructors():
    return User.objects.filter(role__code="INSTRUCTOR").count()


def count_students():
    return User.objects.filter(role__code="STUDENT").count()


def count_courses():
    return Course.objects.count()


def get_users_by_role():
    return (
        Role.objects
        .annotate(total=Count("user"))
        .values("id", "code", "name", "total")
        .order_by("id")
    )


def get_new_users_by_month(year=None):
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


def get_courses_by_status():
    return (
        Course.objects
        .values("status")
        .annotate(total=Count("id"))
        .order_by("status")
    )


def count_pending_instructor_applications():
    return InstructorProfile.objects.filter(status=InstructorProfile.Status.PENDING).count()


def get_total_revenue():
    result = PaymentTransaction.objects.filter(
        status__in=[PaymentTransactionModel.Status.PAID, PaymentTransactionModel.Status.HOLD]
    ).aggregate(total=Sum("net_amount"))
    return result["total"] or 0


def get_revenue_by_year():
    revenues = (
        PaymentTransaction.objects
        .filter(status__in=[PaymentTransactionModel.Status.PAID, PaymentTransactionModel.Status.HOLD])
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
        result.append({"year": year, "total": revenue_map.get(year, 0)})
    return result


def get_recent_users(limit=5):
    return User.objects.select_related("role").order_by("-date_joined")[:limit]


def get_recent_courses(limit=5):
    return Course.objects.select_related("created_by", "assigned_instructor").order_by("-created_at")[:limit]


def get_recent_instructor_applications(limit=5):
    return (
        InstructorProfile.objects
        .select_related("user", "reviewed_by")
        .order_by("-created_at")[:limit]
    )


def get_recent_enrollments(limit=5):
    """Lấy danh sách đăng ký gần đây."""
    from apps.enrollments.models import Enrollment
    return (
        Enrollment.objects
        .select_related("student", "course")
        .order_by("-created_at")[:limit]
    )


def get_revenue_today():
    """Lấy doanh thu hôm nay."""
    today = timezone.now().date()
    result = PaymentTransaction.objects.filter(
        status__in=[PaymentTransactionModel.Status.PAID, PaymentTransactionModel.Status.HOLD],
        paid_at__date=today,
    ).aggregate(total=Sum("net_amount"))
    return result["total"] or 0


def get_revenue_this_week():
    """Lấy doanh thu tuần này."""
    now = timezone.now()
    start_of_week = now - timezone.timedelta(days=now.weekday())
    result = PaymentTransaction.objects.filter(
        status__in=[PaymentTransactionModel.Status.PAID, PaymentTransactionModel.Status.HOLD],
        paid_at__gte=start_of_week,
    ).aggregate(total=Sum("net_amount"))
    return result["total"] or 0


def get_revenue_last_week():
    """Lấy doanh thu tuần trước."""
    now = timezone.now()
    start_of_week = now - timezone.timedelta(days=now.weekday())
    end_of_last_week = start_of_week
    start_of_last_week = start_of_week - timezone.timedelta(days=7)
    result = PaymentTransaction.objects.filter(
        status__in=[PaymentTransactionModel.Status.PAID, PaymentTransactionModel.Status.HOLD],
        paid_at__gte=start_of_last_week,
        paid_at__lt=end_of_last_week,
    ).aggregate(total=Sum("net_amount"))
    return result["total"] or 0


def get_pending_requests_count():
    """Đếm số yêu cầu hỗ trợ đang chờ xử lý."""
    from apps.support.models import SupportRequest
    return SupportRequest.objects.filter(status=SupportRequest.Status.PENDING).count()


def get_top_courses(limit=5):
    """Lấy top khóa học có nhiều học viên nhất và doanh thu."""
    from apps.enrollments.models import Enrollment
    from django.db.models import Q, OuterRef, Subquery, FloatField

    # Annotate student_count on each course
    courses_qs = Course.objects.annotate(
        _student_count=Count(
            "enrollments",
            filter=Q(enrollments__status=Enrollment.Status.ACTIVE),
        ),
        _total_revenue=Subquery(
            PaymentTransaction.objects.filter(
                enrollments__course=OuterRef("id"),
                status__in=[PaymentTransactionModel.Status.PAID, PaymentTransactionModel.Status.HOLD],
            ).values("enrollments__course").annotate(
                total=Sum("net_amount")
            ).values("total")[:1],
            output_field=FloatField(),
        ),
    ).filter(
        _student_count__gt=0
    ).select_related("assigned_instructor").order_by("-_student_count")[:limit]

    result = []
    for course in courses_qs:
        result.append({
            "id": course.id,
            "title": course.title,
            "student_count": getattr(course, '_student_count', 0),
            "total_revenue": float(course._total_revenue or 0) if hasattr(course, '_total_revenue') and course._total_revenue else 0,
            "instructor_name": course.assigned_instructor.get_full_name() if course.assigned_instructor else None,
        })
    return result
