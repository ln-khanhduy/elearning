"""PaymentRepository - Truy cập DB cho Bảng lương & Cột động."""

from apps.duties.models import (
    InstructorPayment,
    InstructorPaymentColumn,
    InstructorPaymentColumnValue,
)


def get_payment_by_id(payment_id):
    """Lấy bảng lương theo ID."""
    return InstructorPayment.objects.select_related("instructor").filter(id=payment_id).first()


def get_payment(instructor_id, month):
    """Lấy bảng lương của 1 giảng viên theo tháng."""
    return InstructorPayment.objects.filter(instructor_id=instructor_id, month=month).first()


def list_payments(instructor_id=None, month=None):
    """Danh sách bảng lương có thể lọc theo giảng viên/tháng."""
    qs = InstructorPayment.objects.select_related("instructor")
    if instructor_id:
        qs = qs.filter(instructor_id=instructor_id)
    if month:
        qs = qs.filter(month=month)
    return qs.order_by("-month")


def list_payments_by_month(month, status=None, instructor_id=None):
    """Danh sách bảng lương theo tháng + trạng thái + giảng viên (cho export)."""
    qs = InstructorPayment.objects.select_related("instructor").filter(month=month)
    if status:
        qs = qs.filter(status=status)
    if instructor_id:
        qs = qs.filter(instructor_id=instructor_id)
    return qs.order_by("instructor__first_name", "instructor__last_name")


def update_or_create_payment(instructor_id, month, defaults):
    """Tạo mới hoặc cập nhật bảng lương."""
    return InstructorPayment.objects.update_or_create(
        instructor_id=instructor_id,
        month=month,
        defaults=defaults,
    )


def get_payment_details(payment):
    """Lấy chi tiết ca trực của 1 bảng lương."""
    return payment.details.all()


# ==================== CỘT ĐỘNG ====================

def list_payment_columns():
    """Danh sách cột động toàn cục."""
    return InstructorPaymentColumn.objects.all().order_by("created_at")


def count_payment_columns():
    """Đếm số cột động toàn cục."""
    return InstructorPaymentColumn.objects.count()


def get_payment_column_by_id(column_id):
    """Lấy cột động theo ID."""
    return InstructorPaymentColumn.objects.filter(id=column_id).first()


def get_payment_column_by_name(name):
    """Lấy cột động theo tên."""
    return InstructorPaymentColumn.objects.filter(name=name).first()


def create_payment_column(name, column_type):
    """Tạo cột động mới."""
    return InstructorPaymentColumn.objects.create(name=name, column_type=column_type)


def delete_payment_column(column):
    """Xóa cột động."""
    return column.delete()


def get_column_value(payment, column):
    """Lấy giá trị cột động của 1 bảng lương."""
    return payment.column_values.filter(column=column).first()


def list_column_values_by_payments(payment_ids):
    """Lấy tất cả giá trị cột động của danh sách bảng lương."""
    return InstructorPaymentColumnValue.objects.filter(payment_id__in=payment_ids)


def update_or_create_column_value(payment, column, defaults):
    """Tạo mới hoặc cập nhật giá trị cột động."""
    return InstructorPaymentColumnValue.objects.update_or_create(
        payment=payment,
        column=column,
        defaults=defaults,
    )


def get_payment_ids_having_column(column):
    """Danh sách payment_id có giá trị cho 1 cột động."""
    return list(column.values.values_list("payment_id", flat=True).distinct())