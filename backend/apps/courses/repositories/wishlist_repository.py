from apps.courses.models import WishlistItem


def get_user_wishlist(user):
    """Lấy danh sách yêu thích của học viên."""
    return WishlistItem.objects.filter(student=user).select_related("course").order_by("-created_at")


def is_wishlisted(user, course_id):
    """Kiểm tra khóa học đã được yêu thích chưa."""
    return WishlistItem.objects.filter(student=user, course_id=course_id).exists()


def add_to_wishlist(user, course):
    """Thêm khóa học vào danh sách yêu thích."""
    item, created = WishlistItem.objects.get_or_create(student=user, course=course)
    return item, created


def remove_from_wishlist(user, course_id):
    """Xóa khóa học khỏi danh sách yêu thích."""
    deleted_count, _ = WishlistItem.objects.filter(student=user, course_id=course_id).delete()
    return deleted_count > 0


def count_user_wishlist(user):
    """Đếm số lượng yêu thích của học viên."""
    return WishlistItem.objects.filter(student=user).count()