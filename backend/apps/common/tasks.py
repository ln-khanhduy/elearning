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