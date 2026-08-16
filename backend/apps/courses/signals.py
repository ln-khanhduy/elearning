"""
Signals cho tự động hóa Courses bổ sung xử lý tự động sau các sự kiện.
"""

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.courses.models import Course, CourseAccessPlan
from apps.notifications.services import automation_service

logger = logging.getLogger(__name__)


# (R2) Trường Course.price đã được BỎ — giá chỉ nằm trong CourseAccessPlan.
# Do đó signal "Price Drop Alert" trên Course không còn áp dụng.
# Giữ receiver này ở dạng bỏ qua (no-op) để tránh lỗi AttributeError
# trong hệ thống đang chạy; không xóa để tránh ảnh hưởng repo/import cũ.
@receiver(post_save, sender=Course)
def on_course_price_changed(sender, instance, created, **kwargs):
    """
    (R2) ĐÃ VÔ HIỆU HÓA: Course.price không còn tồn tại (bỏ field).
    Tính năng Price Drop Alert hiện chỉ áp dụng cho CourseAccessPlan
    (xem receiver bên dưới). Hàm này giữ nguyên tên để tương thích import.
    """
    if created:
        return
    # No-op: không đọc instance.price (field đã bỏ)
    return


# (R2) Price Drop Alert cho GÓI truy cập: khi giá gói của khóa giảm,
# thông báo cho học viên có khóa đó trong wishlist.
@receiver(post_save, sender=CourseAccessPlan)
def on_plan_price_changed(sender, instance, created, **kwargs):
    """
    Khi giá gói truy cập (CourseAccessPlan) thay đổi, nếu GIẢM thì
    thông báo Price Drop Alert cho tất cả học viên đã thêm khóa vào wishlist.
    Lần tạo mới (created=True) không kích hoạt alert.
    """
    if created:
        return

    if not instance.pk:
        return

    try:
        old_instance = CourseAccessPlan.objects.get(pk=instance.pk)
        old_price = old_instance.price
        new_price = instance.price

        if new_price < old_price:
            count = automation_service.notify_wishlist_price_drop(
                instance.course, old_price, new_price, plan_name=instance.name
            )
            if count > 0:
                logger.info(
                    f"📉 Price drop alert: Plan '{instance.name}' (Course {instance.course.title}) "
                    f"decreased from {old_price} to {new_price}. Notified {count} users."
                )
    except CourseAccessPlan.DoesNotExist:
        pass
    except Exception as e:
        logger.error(f"Error in plan price drop signal for plan {instance.id}: {e}")