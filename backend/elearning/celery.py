"""
Cấu hình Celery cho xử lý tác vụ bất đồng bộ.
Dùng cho: gửi email, tạo chứng chỉ, thông báo,...

Chạy Celery worker:
    celery -A elearning worker -l info

Chạy Celery beat (tác vụ định kỳ):
    celery -A elearning beat -l info
"""
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'elearning.settings')

app = Celery('elearning')

# Đọc cấu hình từ Django settings với prefix CELERY_
app.config_from_object('django.conf:settings', namespace='CELERY')

# Tự động tìm tasks từ tất cả Django apps đã đăng ký
app.autodiscover_tasks()