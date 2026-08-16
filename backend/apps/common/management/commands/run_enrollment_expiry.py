"""
Management command quét hết hạn enrollment (R2).
Có thể chạy thủ công:
    python manage.py run_enrollment_expiry

Tự động hóa:
- Chuyển enrollment ACTIVE/COMPLETED hết hạn (expires_at <= now) sang EXPIRED.
- Gửi thông báo sắp hết hạn (IN_APP + EMAIL) cho enrollment còn hạn
  có expires_at trong (now, now + access_expiry_notify_days].
"""
import logging

from django.core.management.base import BaseCommand

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Quét và xử lý hết hạn enrollment: chuyển EXPIRED + gửi thông báo sắp hết hạn"

    def handle(self, *args, **options):
        from apps.enrollments.services import expiry_service

        self.stdout.write(self.style.SUCCESS("[EXPIRY] === BẮT ĐẦU QUÉT HẾT HẠN ENROLLMENT ==="))
        self.stdout.write("[EXPIRY] 1. Chuyển enrollment hết hạn sang EXPIRED...")
        expired = expiry_service.expire_enrollments()
        self.stdout.write(self.style.SUCCESS(f"[EXPIRY] Đã chuyển {expired} enrollment sang EXPIRED."))

        self.stdout.write("[EXPIRY] 2. Gửi thông báo sắp hết hạn...")
        warnings = expiry_service.send_expiry_warnings()
        self.stdout.write(self.style.SUCCESS(f"[EXPIRY] Đã gửi {warnings} thông báo sắp hết hạn."))

        self.stdout.write(self.style.SUCCESS("[EXPIRY] === HOÀN THÀNH ==="))