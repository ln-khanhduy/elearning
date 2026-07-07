from apps.support import repositories as support_repo
from apps.payments.models import PaymentTransaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError


def create_request(user, data):
    request_type = data.get("request_type")
    description = data.get("description", "")
    title = data.get("title", "")
    transaction_id = data.get("transaction_id")

    if request_type == "REFUND":
        if not transaction_id:
            raise ValidationError("Vui lòng chọn giao dịch để yêu cầu hoàn tiền.")
        transaction = PaymentTransaction.objects.filter(id=transaction_id, student=user).first()
        if not transaction:
            raise ValidationError("Không tìm thấy giao dịch.")
        from django.conf import settings
        hold_days = getattr(settings, 'PAYMENT_HOLD_DAYS', 7)
        if transaction.status not in [PaymentTransaction.Status.HOLD, PaymentTransaction.Status.PAID]:
            raise ValidationError("Giao dịch không đủ điều kiện hoàn tiền.")
        if transaction.status == PaymentTransaction.Status.HOLD:
            if transaction.hold_time and transaction.hold_time < timezone.now():
                raise ValidationError("Thời hạn hoàn tiền đã kết thúc (quá {} ngày).".format(hold_days))
        if not title:
            title = "Yêu cầu hoàn tiền - {}".format(transaction.course.title)

    request_data = {
        "user": user,
        "request_type": request_type,
        "title": title,
        "description": description,
        "transaction_id": transaction_id,
    }
    return support_repo.create(request_data)


def get_my_requests(user):
    return support_repo.get_by_user(user.id)


def get_requests_by_type(request_type, user):
    return support_repo.get_by_request_type(request_type)


def process_request(request_id, user, data):
    request_obj = support_repo.get_by_id(request_id)
    status = data.get("status")
    resolution_note = data.get("resolution_note")

    request_type = request_obj.request_type
    if not _can_process(user, request_type):
        raise PermissionDenied("Bạn không có quyền xử lý yêu cầu này.")

    if request_type == "REFUND" and status == "RESOLVED":
        transaction = request_obj.transaction
        if transaction:
            transaction.status = PaymentTransaction.Status.REFUNDED
            transaction.refunded_at = timezone.now()
            transaction.refund_reviewed_by = user
            transaction.refund_reviewed_at = timezone.now()
            transaction.save(update_fields=["status", "refunded_at", "refund_reviewed_by", "refund_reviewed_at"])

    return support_repo.update_status(request_obj, status, assigned_to=user, resolution_note=resolution_note)


def _can_process(user, request_type):
    if not user or not user.is_authenticated:
        return False
    role_code = user.role.code if user.role else None
    if role_code == "SUPERADMIN":
        return True
    if request_type == "TECHNICAL":
        return role_code in ["SUPERADMIN"]
    if request_type == "REFUND":
        return role_code in ["FINANCE_ADMIN", "SUPERADMIN"]
    if request_type == "COMPLAINT":
        return role_code in ["USER_MANAGER", "INSTRUCTOR_MANAGER", "SUPERADMIN"]
    if request_type == "OTHER":
        return role_code in ["SUPERADMIN"]
    return False