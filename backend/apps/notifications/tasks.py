"""
Tác vụ bất đồng bộ cho thông báo sử dụng Celery.
Fallback về chạy đồng bộ nếu Celery không khả dụng.
"""
from celery import shared_task


def _safe_delay(task, *args, **kwargs):
    """Chạy tác vụ: bất đồng bộ qua Celery nếu worker đang chạy, nếu không thì chạy đồng bộ."""
    try:
        task.delay(*args, **kwargs)
    except Exception:
        task(*args, **kwargs)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_email_async(self, subject, message, to_email, from_email=None):
    """Gửi email bất đồng bộ."""
    from django.core.mail import send_mail
    from django.conf import settings
    try:
        send_mail(subject, message, from_email or settings.DEFAULT_FROM_EMAIL, [to_email], fail_silently=False)
    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def notify_login_async(self, user_id):
    """Gửi thông báo đăng nhập bất đồng bộ."""
    from apps.users.repositories import user_repository
    from apps.notifications.services import notification_service
    try:
        user = user_repository.get_user_by_id(user_id)
        if user:
            notification_service.create_notification(
                user=user,
                notification_type="LOGIN",
                title="Đăng nhập thành công",
                message=f"Bạn đã đăng nhập vào hệ thống.",
            )
    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def notify_course_completed_async(self, user_id, course_title):
    """Gửi thông báo hoàn thành khóa học bất đồng bộ."""
    from apps.users.repositories import user_repository
    from apps.notifications.services import notification_service
    try:
        user = user_repository.get_user_by_id(user_id)
        if user:
            notification_service.create_notification(
                user=user,
                notification_type="COURSE_COMPLETED",
                title="Hoàn thành khóa học",
                message=f"Chúc mừng bạn đã hoàn thành khóa học '{course_title}'!",
            )
    except Exception as exc:
        raise self.retry(exc=exc)