#!/bin/sh
set -e

echo "[ENTRYPOINT] === Khởi động Backend ==="

# Seed permissions (idempotent - an toàn chạy lặp lại)
echo "[ENTRYPOINT] Seeding permissions..."
python manage.py seed_permissions --noinput 2>/dev/null || echo "[ENTRYPOINT] Seed permissions bị lỗi (bỏ qua)"

# Khởi động:
#   1. Daphne (ASGI web server)
#   2. Celery worker + beat (tác vụ tự động hóa hàng ngày lúc 02:00)
# Chạy song song trong cùng container.
echo "[ENTRYPOINT] Starting Daphne + Celery worker/beat..."

# Chạy Celery worker kèm beat scheduler.
# - --pool=solo: hoạt động với cả broker memory:// (dev) lẫn Redis (production);
#   với memory broker, không thể dùng prefork vì bộ nhớ không chia sẻ giữa các process.
# - -B: nhúng Celery Beat vào worker, đọc CELERY_BEAT_SCHEDULE từ settings.
celery -A elearning worker -B -l info --pool=solo --concurrency=1 &

# Web server (Daphne) chạy nền chính (foreground) của container.
exec daphne -b 0.0.0.0 -p "$PORT" elearning.asgi:application