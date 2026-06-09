from django.db.models import Count
from django.db.models.functions import TruncMonth
from django.utils import timezone

from apps.users.models import User, Role, InstructorProfile
from apps.courses.models import Course


class AdminDashboardRepository:
    @staticmethod
    def count_users():
        return User.objects.count()

    @staticmethod
    def count_admins():
        return User.objects.exclude(role__code__in=["STUDENT", "INSTRUCTOR"]).count()

    @staticmethod
    def count_instructors():
        return User.objects.filter(role__code="INSTRUCTOR").count()

    @staticmethod
    def count_students():
        return User.objects.filter(role__code="STUDENT").count()

    @staticmethod
    def count_courses():
        return Course.objects.count()

    @staticmethod
    def get_users_by_role():
        return (
            Role.objects
            .annotate(total=Count("users"))
            .values("id", "code", "name", "total")
            .order_by("id")
        )

    @staticmethod
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

    @staticmethod
    def get_courses_by_status():
        return (
            Course.objects
            .values("status")
            .annotate(total=Count("id"))
            .order_by("status")
        )

    @staticmethod
    def count_pending_instructor_applications():
        return InstructorProfile.objects.filter(status="PENDING").count()

    @staticmethod
    def get_recent_users(limit=5):
        return User.objects.select_related("role").order_by("-date_joined")[:limit]

    @staticmethod
    def get_recent_courses(limit=5):
        return Course.objects.select_related("instructor").order_by("-created_at")[:limit]

    @staticmethod
    def get_recent_instructor_applications(limit=5):
        return (
            InstructorProfile.objects
            .select_related("user", "reviewed_by")
            .order_by("-created_at")[:limit]
        )