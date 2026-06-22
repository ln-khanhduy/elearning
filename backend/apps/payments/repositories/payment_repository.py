from django.utils import timezone
from rest_framework.exceptions import NotFound
from apps.payments.models import PaymentTransaction


class PaymentRepository:
    """Repository quản lý truy vấn PaymentTransaction."""

    @staticmethod
    def get_by_id(transaction_id):
        """Lấy transaction theo ID."""
        transaction = PaymentTransaction.objects.select_related(
            "student", "course", "course__assigned_instructor"
        ).filter(id=transaction_id).first()
        if not transaction:
            raise NotFound("Không tìm thấy giao dịch.")
        return transaction

    @staticmethod
    def get_by_provider_transaction_id(provider, provider_transaction_id):
        """Lấy transaction theo provider + provider_transaction_id."""
        return PaymentTransaction.objects.filter(
            provider=provider,
            provider_transaction_id=provider_transaction_id
        ).first()

    @staticmethod
    def get_pending_by_user_and_course(user_id, course_id):
        """Lấy PENDING transaction của user cho course."""
        return PaymentTransaction.objects.filter(
            student_id=user_id,
            course_id=course_id,
            status="PENDING"
        ).first()

    @staticmethod
    def get_by_user(user_id):
        """Lấy tất cả transaction của user."""
        return PaymentTransaction.objects.filter(
            student_id=user_id
        ).select_related("course").order_by("-created_at")

    @staticmethod
    def get_all_for_admin(filters=None):
        """Lấy tất cả transaction cho Finance Admin."""
        qs = PaymentTransaction.objects.select_related(
            "student", "course", "course__assigned_instructor"
        ).all().order_by("-created_at")

        if filters:
            if filters.get("status"):
                qs = qs.filter(status=filters["status"])
            if filters.get("provider"):
                qs = qs.filter(provider=filters["provider"])
            if filters.get("course"):
                qs = qs.filter(course_id=filters["course"])
            if filters.get("student"):
                qs = qs.filter(student_id=filters["student"])
            if filters.get("date_from"):
                qs = qs.filter(created_at__gte=filters["date_from"])
            if filters.get("date_to"):
                qs = qs.filter(created_at__lte=filters["date_to"])

        return qs

    @staticmethod
    def get_by_instructor(instructor_id):
        """Lấy transaction của các khóa học do instructor phụ trách."""
        return PaymentTransaction.objects.filter(
            course__assigned_instructor_id=instructor_id
        ).select_related("student", "course").order_by("-created_at")

    @staticmethod
    def create(data):
        """Tạo transaction mới."""
        return PaymentTransaction.objects.create(**data)

    @staticmethod
    def update(transaction, **kwargs):
        """Cập nhật transaction."""
        for key, value in kwargs.items():
            setattr(transaction, key, value)
        transaction.save()
        return transaction

    @staticmethod
    def get_held_transactions_expired():
        """Lấy các transaction HOLD đã hết hạn giữ tiền."""
        return PaymentTransaction.objects.filter(
            status="HOLD",
            hold_time__lte=timezone.now()
        )
