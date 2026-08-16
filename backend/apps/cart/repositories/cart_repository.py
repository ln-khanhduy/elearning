from apps.cart.models import Cart, CartItem


def get_user_cart(user):
    """Lấy giỏ hàng của học viên, tạo mới nếu chưa có."""
    cart, created = Cart.objects.get_or_create(student=user)
    return cart


def get_cart_with_items(user):
    """Lấy giỏ hàng kèm danh sách items (kèm course + gói)."""
    cart = get_user_cart(user)
    items = CartItem.objects.filter(cart=cart).select_related("course", "access_plan")
    return cart, items


def add_to_cart(user, course, access_plan):
    """(R2) Thêm khóa học + GÓI vào giỏ hàng. Trả về (item, created).
    Gói (access_plan) bắt buộc — chọn gói trước khi thêm vào giỏ.
    """
    cart = get_user_cart(user)
    item, created = CartItem.objects.get_or_create(
        cart=cart,
        course=course,
        defaults={"access_plan": access_plan},
    )
    # Nếu item đã tồn tại, cập nhật gói mới nhất được chọn
    if not created and item.access_plan_id != access_plan.id:
        item.access_plan = access_plan
        item.save(update_fields=["access_plan", "updated_at"])
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
    """(R2) Tính tổng tiền giỏ hàng theo GÓI đã chọn (Course.price đã bỏ)."""
    cart, items = get_cart_with_items(user)
    total = sum(item.access_plan.price for item in items if item.access_plan)
    return total


def cleanup_enrolled_courses(user, course_ids):
    """Xóa khỏi giỏ hàng các khóa học đã mua/đã ghi danh."""
    cart = get_user_cart(user)
    CartItem.objects.filter(
        cart=cart,
        course_id__in=course_ids,
    ).delete()