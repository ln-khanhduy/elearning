from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.payments.models import PaymentTransaction
from apps.payments.models import PaymentTransaction as PaymentTransactionModel


class Command(BaseCommand):
    help = "Tự động đánh dấu các giao dịch HOLD đã hết hạn giữ tiền thành PAID."

    def handle(self, *args, **options):
        now = timezone.now()
        expired_transactions = PaymentTransaction.objects.filter(
            status=PaymentTransactionModel.Status.HOLD,
            hold_time__lte=now,
        )

        count = expired_transactions.count()
        if count == 0:
            self.stdout.write(self.style.SUCCESS("Không có giao dịch nào cần giải phóng."))
            return

        updated = expired_transactions.update(status=PaymentTransactionModel.Status.PAID)
        self.stdout.write(
            self.style.SUCCESS(
                f"Đã giải phóng {updated} giao dịch hết hạn giữ tiền."
            )
        )
