from django.conf import settings
from django.db import models


class Cart(models.Model):
    """
    Giỏ hàng - mỗi học viên có một giỏ hàng duy nhất.
    Lưu tạm thời các khóa học học viên muốn mua trước khi thanh toán.
    """
    student = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cart'

    def __str__(self):
        return f"Giỏ hàng của {self.student.email}"


class CartItem(models.Model):
    """
    Mục trong giỏ hàng - mỗi item là một khóa học được thêm vào giỏ.
    """
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='cart_items')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cart_item'
        unique_together = ('cart', 'course')  # Mỗi khóa học chỉ xuất hiện 1 lần trong giỏ
        ordering = ['-added_at']