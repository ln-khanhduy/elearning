from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum
from rest_framework.exceptions import NotFound
from apps.promotions.repositories import coupon_repository


def get_coupons():
    """Lấy danh sách tất cả coupon."""
    return coupon_repository.get_all()


def get_coupon_detail(coupon_id):
    """Lấy chi tiết coupon."""
    return coupon_repository.get_by_id(coupon_id)


def create_coupon(user, data):
    """Tạo coupon mới."""
    data["created_by"] = user
    return coupon_repository.create(data)


def update_coupon(coupon_id, data):
    """Cập nhật coupon."""
    coupon = coupon_repository.get_by_id(coupon_id)
    return coupon_repository.update(coupon, data)


def delete_coupon(coupon_id):
    """Xóa coupon."""
    coupon = coupon_repository.get_by_id(coupon_id)
    coupon.delete()
    return True


def validate_coupon(code, user, course_ids=None):
    """
    Kiểm tra mã giảm giá có hợp lệ không.
    Trả về tuple (is_valid, error_message, coupon_info).
    """
    coupon = coupon_repository.get_by_code(code)
    if not coupon:
        return False, "Mã giảm giá không tồn tại.", None

    now = timezone.now()
    errors = []

    # Kiểm tra is_active
    if not coupon.is_active:
        errors.append("Mã giảm giá đã bị vô hiệu hóa.")

    # Kiểm tra thời gian hiệu lực
    if now < coupon.start_date:
        errors.append("Mã giảm giá chưa đến hạn sử dụng.")
    if now > coupon.end_date:
        errors.append("Mã giảm giá đã hết hạn.")

    # Kiểm tra số lượt dùng tối đa
    if coupon.max_usage_count > 0 and coupon.used_count >= coupon.max_usage_count:
        errors.append("Mã giảm giá đã hết lượt sử dụng.")

    # Kiểm tra số lượt dùng của user
    if coupon.max_uses_per_user > 0:
        user_usage_count = coupon.usages.filter(user=user).count()
        if user_usage_count >= coupon.max_uses_per_user:
            errors.append("Bạn đã hết lượt sử dụng mã giảm giá này.")

    # Kiểm tra khóa học áp dụng
    if course_ids and coupon.applicable_courses.exists():
        from apps.courses.models import Course
        applicable_ids = set(coupon.applicable_courses.values_list("id", flat=True))
        requested_ids = set(course_ids)
        if not requested_ids.issubset(applicable_ids):
            errors.append("Mã giảm giá không áp dụng cho một số khóa học trong giỏ hàng.")

    if errors:
        return False, "; ".join(errors), None

    # Trả về thông tin coupon
    return True, None, {
        "id": coupon.id,
        "code": coupon.code,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "description": coupon.description,
    }


def apply_coupon_to_cart(code, user, cart_total, course_ids=None):
    """
    Áp dụng mã giảm giá vào giỏ hàng.
    Trả về số tiền được giảm và tổng sau giảm.
    """
    is_valid, error, coupon_info = validate_coupon(code, user, course_ids)
    if not is_valid:
        return {"success": False, "message": error}

    discount_amount = Decimal("0")
    total = Decimal(str(cart_total))

    if coupon_info["discount_type"] == "PERCENTAGE":
        discount_value = Decimal(str(coupon_info["discount_value"]))
        discount_amount = (total * discount_value / Decimal("100")).quantize(Decimal("0.01"))
        # Giới hạn mức giảm tối đa nếu cần
    else:  # FIXED
        discount_amount = Decimal(str(coupon_info["discount_value"]))
        if discount_amount > total:
            discount_amount = total

    final_total = total - discount_amount

    return {
        "success": True,
        "coupon_id": coupon_info["id"],
        "coupon_code": coupon_info["code"],
        "discount_type": coupon_info["discount_type"],
        "discount_value": coupon_info["discount_value"],
        "discount_amount": discount_amount,
        "original_total": total,
        "final_total": final_total,
    }