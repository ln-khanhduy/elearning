"""
Đảm bảo Celery app luôn được import khi Django khởi động,
giúp shared_task hoạt động đúng.
"""
from .celery import app as celery_app

__all__ = ('celery_app',)