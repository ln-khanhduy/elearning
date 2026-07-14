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

# Seed permissions + start Daphne
CMD python manage.py seed_permissions --noinput 2>/dev/null; daphne -b 0.0.0.0 -p $PORT elearning.asgi:application
