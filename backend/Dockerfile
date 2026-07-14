FROM python:3.12-slim

WORKDIR /app

# Cài đặt system dependencies cho PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

# Copy toàn bộ code backend vào /app
COPY . .

# Cài đặt dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Chạy migration khi build (tùy chọn, có thể bỏ qua nếu lỗi)
RUN python manage.py collectstatic --noinput || true

EXPOSE 8000

# Dùng Daphne cho WebSocket + HTTP
CMD daphne -b 0.0.0.0 -p $PORT elearning.asgi:application