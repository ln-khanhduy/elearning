from decimal import Decimal, ROUND_DOWN

from django.utils import timezone

from apps.promotions.repositories import coupon_repository
from apps.promotions.models import Coupon, CouponUsage


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


def _normalize_course_ids(course_ids):
    """Chuẩn hóa danh sách course_ids về kiểu int để so sánh đúng với DB."""
    if not course_ids:
        return None
    normalized = set()
    for cid in course_ids:
        try:
            normalized.add(int(cid))
        except (TypeError, ValueError):
            continue
    return normalized


def validate_coupon(code, user, course_ids=None, cart_total=None):
    """
    Kiểm tra mã giảm giá có hợp lệ không.
    Trả về tuple (is_valid, error_message, coupon_info).
    - cart_total là tổng tiền (server tự tính hoặc client gửi lên để validate UI).
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
        applicable_ids = set(coupon.applicable_courses.values_list("id", flat=True))
        requested_ids = _normalize_course_ids(course_ids)
        if requested_ids and not requested_ids.issubset(applicable_ids):
            errors.append("Mã giảm giá không áp dụng cho một số khóa học trong giỏ hàng.")

    # Kiểm tra giá trị đơn hàng tối thiểu
    missing_amount = None
    if cart_total is not None and coupon.min_order_amount and coupon.min_order_amount > 0:
        if Decimal(str(cart_total)) < coupon.min_order_amount:
            missing_amount = coupon.min_order_amount - Decimal(str(cart_total))
            errors.append(
                f"Đơn hàng chưa đạt giá trị tối thiểu {coupon.min_order_amount:,.0f}₫ để sử dụng mã giảm giá này."
            )

    if errors:
        return False, "; ".join(errors), None

    # Trả về thông tin coupon
    return True, None, {
        "id": coupon.id,
        "code": coupon.code,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "description": coupon.description,
        "min_order_amount": coupon.min_order_amount,
        "missing_amount": missing_amount,
    }


def calculate_discount_amount(coupon, total):
    """
    Tính số tiền giảm giá dựa trên coupon và tổng tiền (Decimal).
    - PERCENTAGE: total * discount_value / 100, làm tròn xuống số nguyên VND.
    - FIXED: discount_value, không vượt quá total.
    """
    total = Decimal(str(total))
    if coupon.discount_type == Coupon.DiscountType.PERCENTAGE:
        discount_value = Decimal(str(coupon.discount_value))
        discount_amount = (total * discount_value / Decimal("100")).quantize(
            Decimal("1"), rounding=ROUND_DOWN
        )
    else:
        discount_amount = Decimal(str(coupon.discount_value))
        if discount_amount > total:
            discount_amount = total
    return discount_amount


def apply_coupon_to_cart(code, user, cart_total, course_ids=None):
    """
    Áp dụng mã giảm giá vào giỏ hàng.
    Trả về số tiền được giảm và tổng sau giảm.
    """
    is_valid, error, coupon_info = validate_coupon(code, user, course_ids, cart_total)
    if not is_valid:
        return {"success": False, "message": error}

    total = Decimal(str(cart_total))
    coupon = coupon_repository.get_by_id(coupon_info["id"])
    discount_amount = calculate_discount_amount(coupon, total)
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


def get_cart_total_from_server(user, course_ids):
    """
    (R2) Tính tổng tiền từ server dựa trên GIỎ HÀNG thực tế (giá GÓI đã chọn).
    Không tin giá trị client gửi lên để tránh gian lận.
    """
    from apps.cart.models import Cart, CartItem

    cart = Cart.objects.filter(student=user).first()
    if not cart:
        return Decimal("0")

    items = CartItem.objects.filter(
        cart=cart,
        course_id__in=_normalize_course_ids(course_ids) or [],
        access_plan__isnull=False,
    ).select_related("access_plan")

    return sum((Decimal(str(item.access_plan.price)) for item in items), Decimal("0"))


def lock_coupon_by_code(code):
    """
    Khoá dòng Coupon (SELECT ... FOR UPDATE) trong transaction để ngăn
    tình trạng vượt quá max_usage_count khi 2 request thanh toán cùng lúc.
    """
    return Coupon.objects.select_for_update().filter(code=code).first()


def record_coupon_usage(coupon, user, transaction, discount_amount):
    """
    Ghi nhận lượt dùng mã giảm giá sau khi thanh toán thành công.
    Idempotent: nếu đã có CouponUsage cho (coupon, user, transaction) thì không tạo trùng.
    Tăng used_count nguyên tử bằng F().
    """
    usage, created = CouponUsage.objects.get_or_create(
        coupon=coupon,
        user=user,
        transaction=transaction,
        defaults={
            "discount_amount": Decimal(str(discount_amount)),
        },
    )
    if not created:
        return usage, False

    # Tăng used_count đúng 1 lần cho mỗi lần dùng thành công
    coupon_repository.increment_usage(coupon)
    return usage, True