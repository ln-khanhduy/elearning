from decimal import Decimal, ROUND_HALF_UP

from django.utils import timezone

from apps.payments.repositories import payment_repository
from apps.payments.models import PaymentTransaction
from apps.system.repositories import system_config_repository
from apps.enrollments.repositories import enrollment_repository
from apps.lessons.repositories import lesson_repository
from apps.courses.models import Course
from apps.enrollments.models import Enrollment


def calculate_fees(gross_amount, provider):
    """
    Tính toán hoa hồng/giá trị từ gross_amount (theo cách tính lương mới).
    - Giảng viên KHÔNG nhận hoa hồng từ khóa học: instructor_share_amount = 0.
    - Toàn bộ tiền bán khóa chuyển về tài khoản web: platform_fee_amount = gross.
    - Giữ nguyên cấu trúc trả về để tương thích model PaymentTransaction.
    """
    gross = Decimal(str(gross_amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    payment_fee = Decimal("0.00")
    tax = Decimal("0.00")
    net = gross
    platform_fee = gross
    instructor_share = Decimal("0.00")

    return {
        "gross_amount": gross,
        "payment_fee_amount": payment_fee,
        "tax_amount": tax,
        "net_amount": net,
        "platform_fee_amount": platform_fee,
        "instructor_share_amount": instructor_share,
    }


def create_pending_transaction(user, course, provider, access_plan=None, payable_amount=None):
    """Tạo PaymentTransaction với status PENDING.
    - access_plan: gói truy cập đã chọn; payable_amount mặc định = access_plan.price.
    - KHÔNG còn course.price (đã bỏ field).
    """
    if access_plan is not None:
        gross = Decimal(str(payable_amount)) if payable_amount is not None else Decimal(str(access_plan.price))
    else:
        gross = Decimal(str(payable_amount)) if payable_amount is not None else Decimal("0")

    fees = calculate_fees(gross, provider)

    transaction = payment_repository.create({
        "student": user,
        "course": course,
        "provider": provider,
        "provider_transaction_id": None,
        "access_plan": access_plan,
        **fees,
        "status": PaymentTransaction.Status.PENDING,
    })
    return transaction


def mark_transaction_hold(transaction):
    """
    Chuyển transaction từ PENDING -> HOLD.
    - paid_at = now
    - hold_time = now + payment_hold_days (từ SystemConfig)
    - expires_at = paid_at + duration_days của gói đã mua
    """
    now = timezone.now()
    hold_days = int(system_config_repository.get_decimal("payment_hold_days", "7"))
    hold_time = now + timezone.timedelta(days=hold_days)

    expires_at = None
    if transaction.access_plan is not None:
        expires_at = now + timezone.timedelta(days=transaction.access_plan.duration_days)

    return payment_repository.update(
        transaction,
        status=PaymentTransaction.Status.HOLD,
        paid_at=now,
        hold_time=hold_time,
        expires_at=expires_at,
    )


def compute_expires_at(transaction):
    """
    Tính expires_at = paid_at + duration_days (từ gói đã mua).
    Không có gói → None (không giới hạn).
    """
    if not transaction or not transaction.access_plan or not transaction.paid_at:
        return None
    return transaction.paid_at + timezone.timedelta(days=transaction.access_plan.duration_days)


def grant_course_access(transaction):
    """
    Tạo ENROLLMENT MỚI (mỗi lần mua) + CourseProgress MỚI.
    KHÔNG kế thừa tiến độ cũ. Chỉ sau khi transaction HOLD (paid_at có giá trị).
    """
    student = transaction.student
    course = transaction.course

    expires_at = compute_expires_at(transaction)

    enrollment = enrollment_repository.create({
        "student": student,
        "course": course,
        "status": Enrollment.Status.ACTIVE,
        "payment_transaction": transaction,
        "access_plan": transaction.access_plan,
        "enrolled_at": timezone.now(),
        "expires_at": expires_at,
    })

    total_lessons = lesson_repository.count_by_course(course.id)
    progress_defaults = {
        "total_lessons_count": total_lessons,
        "progress_percent": Decimal("0.00"),
        "started_at": timezone.now(),
        "last_activity_at": timezone.now(),
    }
    enrollment_repository.get_or_create_course_progress(enrollment, progress_defaults)

    return enrollment


def validate_course_for_payment(user, course, access_plan=None):
    """
    Kiểm tra khóa + gói có thể thanh toán không.
    - Khóa phải PUBLISHED.
    - Gói (nếu có): thuộc khóa, is_active, giá > 0.
    - Cho phép mua lại khi enrollment cũ hết hạn (EXPIRED / expires_at <= now).
    - Chặn mua nếu đang có enrollment ACTIVE/COMPLETED CÒN HẠN.
    """
    if course.status != Course.Status.PUBLISHED:
        return False, "Khóa học chưa được công bố."

    if access_plan is not None:
        if access_plan.course_id != course.id:
            return False, "Gói truy cập không thuộc khóa học này."
        # Mọi gói đều hoạt động
        if access_plan.price <= 0:
            return False, "Giá gói không hợp lệ."

    existing = enrollment_repository.find_active_or_completed(user, course)
    if existing:
        return False, "Bạn đã đăng ký khóa học này và còn thời hạn truy cập."
    return True, None


def get_instructor_revenue(instructor_id):
    """Tính doanh thu cho instructor."""
    transactions = payment_repository.get_by_instructor(instructor_id)

    total_hold = Decimal("0.00")
    total_available = Decimal("0.00")
    total_refunded = Decimal("0.00")
    now = timezone.now()

    result_transactions = []

    for t in transactions:
        if t.status in [PaymentTransaction.Status.FAILED]:
            continue

        item = {
            "id": t.id,
            "course_title": t.course.title,
            "student_name": t.student.get_full_name(),
            "provider": t.provider,
            "gross_amount": t.gross_amount,
            "instructor_share_amount": t.instructor_share_amount,
            "status": t.status,
            "paid_at": t.paid_at,
            "hold_time": t.hold_time,
            "created_at": t.created_at,
        }
        result_transactions.append(item)

        if t.status == PaymentTransaction.Status.REFUNDED:
            total_refunded += t.instructor_share_amount
        elif t.status == PaymentTransaction.Status.HOLD:
            if t.hold_time and t.hold_time > now:
                total_hold += t.instructor_share_amount
            else:
                total_available += t.instructor_share_amount
        elif t.status == PaymentTransaction.Status.PAID:
            total_available += t.instructor_share_amount

    return {
        "total_hold": total_hold,
        "total_available": total_available,
        "total_refunded": total_refunded,
        "total_transactions": len(result_transactions),
        "transactions": result_transactions,
    }