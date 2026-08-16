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
    Mục trong giỏ hàng - mỗi item là một khóa học + GÓI truy cập đã chọn (R2).
    Bắt buộc chọn gói TRƯỚC KHI thêm vào giỏ (access_plan không null).
    """
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='cart_items')
    # (R2) Gói truy cập đã chọn — BẮT BUỘC (chọn gói trước khi thêm vào giỏ).
    # Non-nullable ở DB level (dữ liệu cũ đã xóa, không cần null=True).
    access_plan = models.ForeignKey(
        'courses.CourseAccessPlan',
        on_delete=models.CASCADE,
        related_name='cart_items',
    )
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cart_item'
        unique_together = ('cart', 'course')  # Mỗi khóa học chỉ xuất hiện 1 lần trong giỏ
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.course.title} - {self.access_plan.name} ({self.access_plan.price:,.0f}đ)"