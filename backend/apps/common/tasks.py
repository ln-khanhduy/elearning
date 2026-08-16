"""
Tác vụ định kỳ cho Celery Beat.
"""
import logging

from celery import shared_task
from django.core.management import call_command

logger = logging.getLogger(__name__)


@shared_task(name='apps.common.tasks.run_automation_task')
def run_automation_task():
    """
    Chạy tất cả tác vụ tự động hóa hệ thống (certificates, reminders,
    reviews, reports) thông qua management command run_automation.
    """
    try:
        call_command('run_automation')
    except Exception as exc:
        logger.error(f"Lỗi chạy run_automation qua Celery Beat: {exc}", exc_info=True)
        raise


@shared_task(name='apps.common.tasks.run_enrollment_expiry_task')
def run_enrollment_expiry_task():
    """
    (R2) Chạy định kỳ quét hết hạn enrollment:
    - Chuyển enrollment ACTIVE/COMPLETED hết hạn (expires_at <= now) sang EXPIRED.
    - Gửi thông báo sắp hết hạn (IN_APP + EMAIL).
    """
    try:
        call_command('run_enrollment_expiry')
    except Exception as exc:
        logger.error(f"Lỗi chạy run_enrollment_expiry qua Celery Beat: {exc}", exc_info=True)
        raise


@shared_task(name='apps.common.tasks.compute_instructor_payroll_task')
def compute_instructor_payroll_task(month=None):
    """(R1) Tổng hợp lương giảng viên tháng trước — chạy đầu tháng tự động."""
    from django.utils import timezone
    from apps.duties.services import compute_all_payments

    if not month:
        last = timezone.now().replace(day=1) - timezone.timedelta(days=1)
        month = last.strftime('%Y-%m')
    try:
        results = compute_all_payments(month)
        logger.info(f"Payroll %s: computed %d instructor payments.", month, len(results))
        return {"month": month, "count": len(results)}
    except Exception as exc:
        logger.error(f"Lỗi tổng hợp lương {month} qua Celery Beat: {exc}", exc_info=True)
        raise
