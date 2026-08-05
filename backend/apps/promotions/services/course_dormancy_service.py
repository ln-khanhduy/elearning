"""
Dịch vụ phát hiện khóa học thiếu học viên mới trong 3 tháng.

Khóa học được coi là "nguội" khi:
- Đã có học viên đăng ký: lấy ngày đăng ký mới nhất (max enrolled_at).
- Chưa có học viên nào: lấy ngày publish (published_at), fallback về created_at.
Khóa học nguội khi ngày gốc này <= hiện tại trừ đi `days` ngày (mặc định 90 ngày).
"""
from datetime import timedelta

from django.utils import timezone


def get_stale_course_ids(days=90):
    """Trả về list id các khóa học PUBLISHED không có học viên mới trong `days` ngày."""
    from apps.courses.models import Course
    from apps.enrollments.models import Enrollment

    now = timezone.now()
    anchor = now - timedelta(days=days)

    stale_ids = []
    courses = Course.objects.filter(status=Course.Status.PUBLISHED).only(
        "id", "title", "created_at", "published_at"
    )

    for course in courses:
        last_enrollment = (
            Enrollment.objects.filter(course=course)
            .order_by("-enrolled_at")
            .values_list("enrolled_at", flat=True)
            .first()
        )
        if last_enrollment:
            reference_date = last_enrollment
        else:
            reference_date = course.published_at or course.created_at
        if reference_date and reference_date <= anchor:
            stale_ids.append(course.id)

    return stale_ids


def get_admin_users_with_coupon_manage():
    """Trả về QuerySet users có permission finance.coupon.manage."""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    return User.objects.filter(
        role__permissions__code="finance.coupon.manage"
    ).distinct()


def get_stale_courses_detail(days=90):
    """Trả về danh sách khóa học nguội kèm ngày gốc để hiển thị trong form tạo coupon."""
    from apps.courses.models import Course
    from apps.enrollments.models import Enrollment

    now = timezone.now()
    anchor = now - timedelta(days=days)

    result = []
    courses = Course.objects.filter(status=Course.Status.PUBLISHED).only(
        "id", "title", "created_at", "published_at"
    ).order_by("title")

    for course in courses:
        last_enrollment = (
            Enrollment.objects.filter(course=course)
            .order_by("-enrolled_at")
            .values_list("enrolled_at", flat=True)
            .first()
        )
        if last_enrollment:
            reference_date = last_enrollment
            reference_label = last_enrollment.strftime("%d/%m/%Y")
        else:
            reference_date = course.published_at or course.created_at
            reference_label = reference_date.strftime("%d/%m/%Y") if reference_date else None
        if reference_date and reference_date <= anchor:
            result.append({
                "id": course.id,
                "title": course.title,
                "last_enrollment_date": reference_label,
            })

    return result


def notify_stale_courses(days=90):
    """Gửi thông báo cho admin có permission finance.coupon.manage về khóa học nguội."""
    from apps.notifications.models import Notification

    courses = get_stale_courses_detail(days=days)
    if not courses:
        return {"admins_notified": 0, "stale_courses": 0}

    lines = "\n".join(
        f"- {c['title']} ({c['last_enrollment_date']})" for c in courses
    )
    body = (
        f"Những khóa học sau không có học viên mới trong {days} ngày qua. "
        f"Hãy tạo mã giảm giá để kích cầu:\n{lines}"
    )

    admins = get_admin_users_with_coupon_manage()
    count = 0
    for admin in admins:
        try:
            Notification.objects.create(
                recipient=admin,
                title="Khóa học thiếu học viên mới",
                body=body,
                notification_type=Notification.Type.COURSE,
                channel=Notification.Channel.IN_APP,
                link="/admin/coupons",
                send_status=Notification.SendStatus.SENT,
            )
            count += 1
        except Exception:
            continue

    return {"admins_notified": count, "stale_courses": len(courses)}