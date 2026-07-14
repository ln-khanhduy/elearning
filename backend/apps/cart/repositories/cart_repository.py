from apps.cart.models import Cart, CartItem
from apps.enrollments.models import Enrollment


def get_user_cart(user):
    """Lấy giỏ hàng của học viên, tạo mới nếu chưa có."""
    cart, created = Cart.objects.get_or_create(student=user)
    return cart


def get_cart_with_items(user):
    """Lấy giỏ hàng kèm danh sách items."""
    cart = get_user_cart(user)
    items = CartItem.objects.filter(cart=cart).select_related("course")
    return cart, items


def add_to_cart(user, course):
    """Thêm khóa học vào giỏ hàng. Trả về (item, created)."""
    cart = get_user_cart(user)
    item, created = CartItem.objects.get_or_create(cart=cart, course=course)
    return item, created


def remove_from_cart(user, course_id):
    """Xóa khóa học khỏi giỏ hàng."""
    cart = get_user_cart(user)
    deleted_count, _ = CartItem.objects.filter(cart=cart, course_id=course_id).delete()
    return deleted_count > 0


def clear_cart(user):
    """Xóa toàn bộ giỏ hàng."""
    cart = get_user_cart(user)
    cart.items.all().delete()


def get_cart_total(user):
    """Tính tổng tiền giỏ hàng."""
    cart, items = get_cart_with_items(user)
    total = sum(item.course.price for item in items if item.course)
    return total


def cleanup_enrolled_courses(user, course_ids):
    """Xóa khỏi giỏ hàng các khóa học đã mua/đã ghi danh."""
    cart = get_user_cart(user)
    CartItem.objects.filter(
        cart=cart,
        course_id__in=course_ids,
    ).delete()