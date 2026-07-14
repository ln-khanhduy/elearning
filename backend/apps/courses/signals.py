"""
Signals cho tự động hóa Courses bổ sung xử lý tự động sau các sự kiện.
"""

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.courses.models import Course
from apps.notifications.services import automation_service

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Course)
def on_course_price_changed(sender, instance, created, **kwargs):
    """
    Khi giá khóa học thay đổi, kiểm tra nếu giá giảm và thông báo
    cho tất cả học viên đã thêm khóa học vào wishlist.
    
    Đây là tính năng Price Drop Alert - tự động gửi notification
    khi khóa học trong wishlist giảm giá.
    
    Lưu ý: Lần tạo đầu tiên (created=True) sẽ không kích hoạt alert.
    Chỉ kích hoạt khi giá thực sự thay đổi so với trước đó.
    """
    if created:
        return

    if not instance.pk:
        return

    try:
        # Lấy giá cũ từ database (trước khi save)
        old_instance = Course.objects.get(pk=instance.pk)
        old_price = old_instance.price
        new_price = instance.price

        # Chỉ gửi alert khi giá giảm
        if new_price < old_price:
            count = automation_service.notify_wishlist_price_drop(instance, old_price, new_price)
            if count > 0:
                logger.info(
                    f"📉 Price drop alert: Course {instance.title} decreased from "
                    f"{old_price} to {new_price}. Notified {count} users."
                )
    except Course.DoesNotExist:
        pass
    except Exception as e:
        logger.error(f"Error in price drop signal for course {instance.id}: {e}")