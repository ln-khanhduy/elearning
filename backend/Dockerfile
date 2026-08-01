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

EXPOSE 8000

# Đảm bảo entrypoint.sh có quyền thực thi
# và strip CRLF (an toàn khi build trên Windows - tránh lỗi `\r: not found`)
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Chạy entrypoint: seed permissions + Daphne (web) + Celery worker/beat (tự động hóa)
CMD ["/app/entrypoint.sh"]
