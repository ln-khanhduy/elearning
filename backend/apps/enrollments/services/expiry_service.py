"""
Dịch vụ xử lý hết hạn enrollment.

Chạy định kỳ (Celery Beat / management command):
1. Quét enrollment ACTIVE/COMPLETED có expires_at <= now → chuyển status EXPIRED.
2. Quét enrollment còn hạn có expires_at trong (now, now + access_expiry_notify_days]
   → gửi thông báo IN_APP + EMAIL (chống gửi trùng bằng cách kiểm tra Notification đã tồn tại).
"""
import logging
from datetime import timedelta

from django.utils import timezone

from apps.enrollments.models import Enrollment
from apps.notifications.models import Notification
from apps.system.repositories import system_config_repository
from apps.notifications.services import notification_service as notif_svc

logger = logging.getLogger(__name__)

# Link pattern để chống gửi trùng thông báo sắp hết hạn
_EXPIRY_WARNING_TITLE = "Khóa học sắp hết hạn"


def get_expiry_notify_days():
    """Số ngày trước khi hết hạn để gửi thông báo (SystemConfig)."""
    try:
        return int(system_config_repository.get_decimal("access_expiry_notify_days", "7"))
    except Exception:
        return 7


def expire_enrollments():
    """
    Quét enrollment ACTIVE/COMPLETED có expires_at <= now → chuyển status EXPIRED.
    Giữ nguyên toàn bộ dữ liệu lịch sử (tiến độ, điểm, chứng chỉ...).
    """
    now = timezone.now()
    expired_qs = Enrollment.objects.filter(
        status__in=[Enrollment.Status.ACTIVE, Enrollment.Status.COMPLETED],
        expires_at__isnull=False,
        expires_at__lte=now,
    ).select_related("course")

    expired_count = 0
    for enrollment in expired_qs.iterator():
        enrollment.status = Enrollment.Status.EXPIRED
        enrollment.save(update_fields=["status", "updated_at"])
        expired_count += 1

    if expired_count:
        logger.info("Enrollment expiry: %d enrollment(s) moved to EXPIRED.", expired_count)
    return expired_count


def send_expiry_warnings():
    """
    Gửi thông báo sắp hết hạn cho enrollment còn hạn có expires_at trong
    (now, now + access_expiry_notify_days]. Gửi 1 lần/khóa/người bằng cách kiểm tra
    Notification đã tồn tại cho (recipient, course, loại SẮP HẾT HẠN).
    """
    now = timezone.now()
    notify_days = get_expiry_notify_days()
    warning_threshold = now + timedelta(days=notify_days)

    warn_qs = Enrollment.objects.filter(
        student__is_active=True,
        status__in=[Enrollment.Status.ACTIVE, Enrollment.Status.COMPLETED],
        expires_at__isnull=False,
        expires_at__gt=now,
        expires_at__lte=warning_threshold,
    ).select_related("student", "course", "access_plan")

    sent = 0
    for enrollment in warn_qs.iterator():
        try:
            student = enrollment.student
            course = enrollment.course
            expires_at = enrollment.expires_at

            # Chống gửi trùng: chỉ gửi nếu chưa có notification "sắp hết hạn" cho
            # (recipient, course) hôm nay.
            link = f"/learning/courses/{course.id}/"
            already_sent = Notification.objects.filter(
                recipient=student,
                link=link,
                title=_EXPIRY_WARNING_TITLE,
                created_at__date=now.date(),
            ).exists()
            if already_sent:
                continue

            plan_name = enrollment.access_plan.name if enrollment.access_plan else None
            days_left = max(1, (expires_at - now).days)
            body = (
                f'Khóa học "{course.title}"'
                + (f' (gói "{plan_name}")' if plan_name else "")
                + f" sẽ hết hạn vào {expires_at.strftime('%d/%m/%Y %H:%M')} "
                + f"(còn {days_left} ngày). Vui lòng hoàn tất việc học trước khi hết hạn. "
                + "Sau khi hết hạn, bạn cần mua lại để tiếp tục truy cập nội dung."
            )

            # IN_APP
            notif_svc._create(
                recipient=student,
                title=_EXPIRY_WARNING_TITLE,
                body=body,
                notification_type=Notification.Type.COURSE,
                channel=Notification.Channel.IN_APP,
                link=link,
            )
            # EMAIL
            notif_svc._create(
                recipient=student,
                title=_EXPIRY_WARNING_TITLE,
                body=body,
                notification_type=Notification.Type.COURSE,
                channel=Notification.Channel.EMAIL,
                link=link,
            )
            sent += 1
        except Exception as e:
            logger.error(f"Failed to send expiry warning for enrollment {enrollment.id}: {e}")

    if sent:
        logger.info("Enrollment expiry warning: %d notification(s) sent.", sent)
    return sent


def track_access_expiry():
    """
    Chạy toàn bộ: chuyển EXPIRED + gửi cảnh báo sắp hết hạn.
    """
    expired = expire_enrollments()
    warnings = send_expiry_warnings()
    return {"expired": expired, "warnings_sent": warnings}