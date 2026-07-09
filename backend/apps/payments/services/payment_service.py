from decimal import Decimal, ROUND_HALF_UP
from django.conf import settings
from django.utils import timezone
from apps.payments.repositories import payment_repository 
from apps.payments.models import PaymentTransaction
from apps.system.repositories import system_config_repository
from apps.enrollments.repositories import enrollment_repository
from apps.lessons.repositories import lesson_repository
from apps.courses.models import Course


def calculate_fees(gross_amount, provider):
    """
    Tính toán các khoản phí từ gross_amount.
    - payment_fee: phí provider (%)
    - tax_amount: 0 (chưa áp dụng)
    - net_amount: gross - payment_fee - tax
    - platform_fee: net * PLATFORM_FEE_PERCENT%
    - instructor_share: net - platform_fee
    """
    gross = Decimal(str(gross_amount))

    fee_percent = system_config_repository.get_decimal("payment_fee_percent")
    payment_fee = (gross * fee_percent / Decimal("100")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )

    # Tax từ SystemConfig
    tax_percent = system_config_repository.get_decimal("tax_percent")
    tax = (gross * tax_percent / Decimal("100")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )

    # Net amount
    net = (gross - payment_fee - tax).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )

    # Platform fee từ SystemConfig
    pf_percent = system_config_repository.get_decimal("platform_fee_percent")
    platform_fee = (net * pf_percent / Decimal("100")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )

    # Instructor share
    instructor_share = (net - platform_fee).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )

    return {
        "gross_amount": gross,
        "payment_fee_amount": payment_fee,
        "tax_amount": tax,
        "net_amount": net,
        "platform_fee_amount": platform_fee,
        "instructor_share_amount": instructor_share,
    }
def create_pending_transaction(user, course, provider):
    """Tạo PaymentTransaction với status PENDING."""
    fees = calculate_fees(course.price, provider)

    transaction = payment_repository.create({
        "student": user,
        "course": course,
        "provider": provider,
        "provider_transaction_id": None,
        **fees,
        "status": PaymentTransaction.Status.PENDING,
    })
    return transaction
def mark_transaction_hold(transaction):
    """
    Chuyển transaction từ PENDING -> HOLD.
    - paid_at = now
    - hold_time = now + PAYMENT_HOLD_DAYS
    """
    now = timezone.now()
    hold_days = settings.PAYMENT_HOLD_DAYS
    hold_time = now + timezone.timedelta(days=hold_days)

    return payment_repository.update(
        transaction,
        status=PaymentTransaction.Status.HOLD,
        paid_at=now,
        hold_time=hold_time,
    )
def grant_course_access(transaction):
    """
    Tạo Enrollment ACTIVE và CourseProgress cho transaction.
    Idempotent: không tạo trùng nếu đã có.
    """
    student = transaction.student
    course = transaction.course

    defaults = {
        "status": "ACTIVE",
        "payment_transaction": transaction,
        "enrolled_at": timezone.now(),
        "access_granted_at": timezone.now(),
    }
    enrollment, created = enrollment_repository.get_or_create_enrollment(student, course, defaults)

    if not created and enrollment.status not in ["ACTIVE", "COMPLETED"]:
        enrollment.status = "ACTIVE"
        enrollment.payment_transaction = transaction
        enrollment.enrolled_at = timezone.now()
        enrollment.access_granted_at = timezone.now()
        enrollment.save()

    total_lessons = lesson_repository.count_by_course(course.id)
    progress_defaults = {
        "total_lessons_count": total_lessons,
        "progress_percent": Decimal("0.00"),
        "started_at": timezone.now(),
        "last_activity_at": timezone.now(),
    }
    enrollment_repository.get_or_create_course_progress(enrollment, progress_defaults)

    return enrollment
def validate_course_for_payment(user, course):
    """
    Kiểm tra course có thể thanh toán không.
    Trả về tuple (is_valid, error_message).
    """
    if course.status != Course.Status.PUBLISHED:
        return False, "Khóa học chưa được công bố."

    if course.price <= 0:
        return False, "Khóa học miễn phí. Vui lòng sử dụng đăng ký miễn phí."

    existing = enrollment_repository.find_active_or_completed(user, course)
    if existing:
        return False, "Bạn đã đăng ký khóa học này."

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
