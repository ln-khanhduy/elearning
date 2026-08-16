# E-Learning (LMS)

Hệ thống quản lý học tập trực tuyến - Django REST Framework (Backend) + React/Vite (Frontend).

## Tài liệu hướng dẫn

Xem chi tiết tại: HUONG_DAN_SU_DUNG.md - bao gồm:
- Hướng dẫn cài đặt môi trường Backend và Frontend
- Hướng dẫn sử dụng quy trình chính: Lịch trực và Lương giảng viên

## Cài đặt nhanh

```bash
# 1. Clone mã nguồn
git clone https://github.com/ln-khanhduy/elearning
cd elearning

# 2. Cài đặt Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_permissions
python manage.py runserver

# 3. Cài đặt Frontend (mở terminal mới)
cd frontend
pnpm install
pnpm dev
```

Lưu ý: Cần tạo file `.env.development` (backend) và `.env` (frontend) trước khi chạy - xem hướng dẫn chi tiết trong `HUONG_DAN_SU_DUNG.md`.