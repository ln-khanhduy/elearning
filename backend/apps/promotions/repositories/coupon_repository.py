from django.db.models import F
from rest_framework.exceptions import NotFound
from apps.promotions.models import Coupon, CouponUsage


def get_all():
    """Lấy danh sách tất cả coupon, kèm thông tin created_by."""
    return Coupon.objects.select_related("created_by").all().order_by("-created_at")


def get_by_id(coupon_id):
    """Lấy chi tiết một coupon theo ID. Trả về 404 nếu không tìm thấy."""
    coupon = Coupon.objects.select_related("created_by").filter(id=coupon_id).first()
    if not coupon:
        raise NotFound("Không tìm thấy mã giảm giá.")
    return coupon


def get_by_code(code):
    """Lấy coupon theo mã code. Trả về None nếu không tìm thấy."""
    return Coupon.objects.select_related("created_by").filter(code=code).first()


def create(data):
    """Tạo một coupon mới với dữ liệu đã được validate."""
    return Coupon.objects.create(**data)


def update(coupon, data):
    """Cập nhật thông tin coupon."""
    for key, value in data.items():
        setattr(coupon, key, value)
    coupon.save()
    return coupon


def delete(coupon):
    """Xóa coupon."""
    coupon.delete()


def exists_by_code(code):
    """Kiểm tra mã code đã tồn tại chưa."""
    return Coupon.objects.filter(code=code).exists()


def create_coupon(code, discount_type, discount_value, max_usage_count, max_uses_per_user,
                  min_order_amount, start_date, end_date, is_active, description, created_by):
    """Tạo coupon mới với đầy đủ tham số."""
    return Coupon.objects.create(
        code=code,
        discount_type=discount_type,
        discount_value=discount_value,
        max_usage_count=max_usage_count,
        max_uses_per_user=max_uses_per_user,
        min_order_amount=min_order_amount,
        start_date=start_date,
        end_date=end_date,
        is_active=is_active,
        description=description,
        created_by=created_by,
    )


def get_coupons_for_activation(now):
    """Lấy coupon chưa active nhưng đã đến start_date."""
    from apps.promotions.models import Coupon as C
    return list(Coupon.objects.filter(
        is_active=False,
        start_date__lte=now,
        end_date__gte=now,
    ))


def get_active_expired_coupons(now):
    """Lấy coupon đang active nhưng đã quá end_date."""
    from apps.promotions.models import Coupon as C
    return list(Coupon.objects.filter(
        is_active=True,
        end_date__lt=now,
    ))


def get_active_coupons_expiring_before(warning_time):
    """Lấy coupon đang active sắp hết hạn."""
    from apps.promotions.models import Coupon as C
    from datetime import timedelta
    return list(Coupon.objects.filter(
        is_active=True,
        end_date__lte=warning_time,
        end_date__gte=warning_time - timedelta(days=1),
    ).select_related('created_by'))


def increment_usage(coupon):
    """Tăng used_count lên 1."""
    Coupon.objects.filter(id=coupon.id).update(used_count=F("used_count") + 1)
    coupon.refresh_from_db()
    return coupon
