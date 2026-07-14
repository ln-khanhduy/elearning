FROM python:3.12-slim

WORKDIR /app

# Cài đặt system dependencies cho PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements và cài đặt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ source code
COPY . .

# Port Render sẽ gán tự động qua biến $PORT
EXPOSE 8000

# Dùng Daphne để hỗ trợ WebSocket + HTTP
CMD daphne -b 0.0.0.0 -p $PORT elearning.asgi:application