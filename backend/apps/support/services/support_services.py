from apps.support import repositories as support_repo
from apps.payments.models import PaymentTransaction
from apps.system.repositories import system_config_repository
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError


def create_request(user, data):
    """Tạo mới một yêu cầu hỗ trợ từ người dùng.

    - Với yêu cầu REFUND: bắt buộc có transaction_id, giao dịch phải thuộc về user,
      ở trạng thái HOLD/PAID và còn trong thời hạn hoàn tiền quy định.
    - Tự động điền tiêu đề cho yêu cầu hoàn tiền nếu không được cung cấp.
    """
    request_type = data.get("request_type")
    description = data.get("description", "")
    title = data.get("title", "")
    transaction_id = data.get("transaction_id")

    # Kiểm tra nếu là REFUND thì kiểm tra điều kiện hoàn tiền
    if request_type == "REFUND":
        if not transaction_id:
            raise ValidationError("Vui lòng chọn giao dịch để yêu cầu hoàn tiền.")
        transaction = PaymentTransaction.objects.filter(id=transaction_id, student=user).first()
        if not transaction:
            raise ValidationError("Không tìm thấy giao dịch.")
        # Kiểm tra giao dịch không quá số ngày quy định (từ SystemConfig)
        hold_days = int(system_config_repository.get_decimal("payment_hold_days", "7"))
        if transaction.status not in [PaymentTransaction.Status.HOLD, PaymentTransaction.Status.PAID]:
            raise ValidationError("Giao dịch không đủ điều kiện hoàn tiền.")
        if transaction.status == PaymentTransaction.Status.HOLD:
            if transaction.hold_time and transaction.hold_time < timezone.now():
                raise ValidationError("Thời hạn hoàn tiền đã kết thúc (quá {} ngày).".format(hold_days))
        # Tự động điền title
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
    """Lấy danh sách yêu cầu hỗ trợ của chính người dùng."""
    return support_repo.get_by_user(user.id)


def get_requests_by_type(request_type, user):
    """Lấy danh sách yêu cầu hỗ trợ theo loại yêu cầu."""
    return support_repo.get_by_request_type(request_type)


def process_request(request_id, user, data):
    """Xử lý một yêu cầu hỗ trợ bởi admin.

    - Kiểm tra quyền xử lý dựa trên loại yêu cầu, nếu không có quyền sẽ báo lỗi PermissionDenied.
    - Với yêu cầu REFUND và trạng thái RESOLVED: gọi Stripe Refund thực tế,
      chỉ chuyển giao dịch sang REFUNDED khi hoàn tiền thành công.
    - Với yêu cầu REFUND và trạng thái REJECTED: chuyển giao dịch sang REFUND_REJECTED.
    """
    request_obj = support_repo.get_by_id(request_id)
    status = data.get("status")
    resolution_note = data.get("resolution_note")

    # Kiểm tra quyền dựa trên request_type
    request_type = request_obj.request_type
    if not _can_process(user, request_type):
        raise PermissionDenied("Bạn không có quyền xử lý yêu cầu này.")

    # Xử lý duyệt hoàn tiền: đúng trạng thái + gọi Stripe Refund thực tế
    if request_type == "REFUND" and status == "RESOLVED":
        transaction = request_obj.transaction
        if not transaction:
            raise ValidationError("Giao dịch không tồn tại để hoàn tiền.")
        if transaction.status in [PaymentTransaction.Status.REFUNDED, PaymentTransaction.Status.REFUND_APPROVED]:
            raise ValidationError("Giao dịch này đã được hoàn tiền trước đó.")

        # Đánh dấu đang xử lý hoàn tiền trên Stripe
        transaction.status = PaymentTransaction.Status.REFUND_APPROVED
        transaction.refund_reviewed_by = user
        transaction.refund_reviewed_at = timezone.now()
        transaction.save(update_fields=["status", "refund_reviewed_by", "refund_reviewed_at"])

        # Gọi Stripe Refund thực tế - thành công mới chuyển REFUNDED
        try:
            from apps.payments.services import stripe_payment_service
            stripe_payment_service.refund_transaction(transaction)
        except Exception as e:
            transaction.status = PaymentTransaction.Status.HOLD
            transaction.save(update_fields=["status"])
            raise ValidationError("Hoàn tiền thất bại: {}".format(str(e)))

        transaction.status = PaymentTransaction.Status.REFUNDED
        transaction.refunded_at = timezone.now()
        transaction.save(update_fields=["status", "refunded_at"])

    # Từ chối hoàn tiền -> chuyển sang REFUND_REJECTED
    elif request_type == "REFUND" and status == "REJECTED":
        transaction = request_obj.transaction
        if transaction:
            transaction.status = PaymentTransaction.Status.REFUND_REJECTED
            transaction.refund_reviewed_by = user
            transaction.refund_reviewed_at = timezone.now()
            transaction.save(update_fields=["status", "refund_reviewed_by", "refund_reviewed_at"])

    return support_repo.update_status(request_obj, status, assigned_to=user, resolution_note=resolution_note)


def _can_process(user, request_type):
    """Kiểm tra user có quyền xử lý loại yêu cầu hỗ trợ hay không.

    - SUPERADMIN: xử lý được tất cả loại yêu cầu.
    - TECHNICAL: chỉ SUPERADMIN.
    - REFUND: chỉ SUPERADMIN.
    - COMPLAINT: USER_MANAGER hoặc SUPERADMIN.
    """
    if not user or not user.is_authenticated:
        return False
    role_code = user.role.code if user.role else None
    if role_code == "SUPERADMIN":
        return True
    if request_type == "TECHNICAL":
        return role_code in ["SUPERADMIN"]
    if request_type == "REFUND":
        return role_code in ["SUPERADMIN"]
    if request_type == "COMPLAINT":
        return role_code in ["USER_MANAGER", "SUPERADMIN"]
    return False