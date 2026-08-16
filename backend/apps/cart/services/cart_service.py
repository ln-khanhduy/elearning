from decimal import Decimal
from django.utils import timezone
from rest_framework.exceptions import NotFound

from apps.cart.repositories import cart_repository
from apps.courses.repositories import course_repository
from apps.enrollments.repositories import enrollment_repository
from apps.lessons.repositories import lesson_repository


def get_cart(user):
    """Lấy thông tin giỏ hàng kèm tổng tiền (theo GÓI đã chọn)."""
    cart, items = cart_repository.get_cart_with_items(user)
    cart_data = []
    total = Decimal("0")

    for item in items:
        if not item.course or not item.access_plan:
            continue
        # (R2) Giá = giá GÓI đã chọn (Course.price đã bỏ)
        price = item.access_plan.price
        cart_data.append({
            "id": item.id,
            "course_id": item.course.id,
            "course_title": item.course.title,
            "course_slug": item.course.slug,
            "thumbnail_url": item.course.thumbnail.url if item.course.thumbnail else None,
            # (R2) thông tin gói
            "plan_id": item.access_plan.id,
            "plan_name": item.access_plan.name,
            "plan_duration_days": item.access_plan.duration_days,
            "price": price,
            "added_at": item.added_at,
        })
        total += price

    return {
        "items": cart_data,
        "total": total,
        "item_count": len(cart_data),
    }


def add_item(user, course_id, plan_id=None):
    """Thêm khóa học + GÓI (plan) vào giỏ hàng.
    Bắt buộc chọn gói TRƯỚC KHI thêm (theo yêu cầu).
    """
    from apps.courses.models import CourseAccessPlan

    course = course_repository.get_by_id(course_id)

    if course.status != "PUBLISHED":
        return {"success": False, "message": "Khóa học chưa được công bố."}

    #bắt buộc chọn gói
    if not plan_id:
        return {"success": False, "message": "Vui lòng chọn gói truy cập trước khi thêm vào giỏ."}

    try:
        access_plan = CourseAccessPlan.objects.get(
            id=plan_id, course_id=course_id
        )
    except CourseAccessPlan.DoesNotExist:
        return {"success": False, "message": "Gói truy cập không hợp lệ."}

    # Kiểm tra đã mua (còn hạn) chưa
    existing = enrollment_repository.find_active_or_completed(user, course)
    if existing:
        return {"success": False, "message": "Bạn đã sở hữu khóa học này và còn thời hạn truy cập."}

    # Kiểm tra đã có trong giỏ chưa (nếu có -> cập nhật gói mới)
    item, created = cart_repository.add_to_cart(user, course, access_plan)
    if not created:
        return {"success": False, "message": "Khóa học đã có trong giỏ hàng."}

    return {"success": True, "message": "Đã thêm vào giỏ hàng."}


def remove_item(user, course_id):
    """Xóa khóa học khỏi giỏ hàng."""
    removed = cart_repository.remove_from_cart(user, course_id)
    if not removed:
        return {"success": False, "message": "Khóa học không có trong giỏ hàng."}
    return {"success": True, "message": "Đã xóa khỏi giỏ hàng."}


def clear(user):
    """Xóa toàn bộ giỏ hàng."""
    cart_repository.clear_cart(user)
    return {"success": True, "message": "Đã xóa toàn bộ giỏ hàng."}