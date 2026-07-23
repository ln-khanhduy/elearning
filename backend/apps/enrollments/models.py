from django.conf import settings
from django.db import models


class Enrollment(models.Model):
    """
    Đăng ký khóa học - ghi nhận học viên đã mua/đăng ký khóa học.
    Mỗi học viên có thể đăng ký nhiều khóa học.
    """
    class Status(models.TextChoices):
        PENDING_PAYMENT = 'PENDING_PAYMENT', 'Pending payment'
        ACTIVE = 'ACTIVE', 'Active'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class RefundStatus(models.TextChoices):
        NONE = 'NONE', 'None'
        REQUESTED = 'REQUESTED', 'Requested'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        REFUNDED = 'REFUNDED', 'Refunded'

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='enrollments')
    payment_transaction = models.ForeignKey('payments.PaymentTransaction', on_delete=models.SET_NULL, null=True, blank=True, related_name='enrollments')
    # Trạng thái đăng ký
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_PAYMENT)
    # Trạng thái hoàn tiền
    refund_status = models.CharField(max_length=20, choices=RefundStatus.choices, default=RefundStatus.NONE)
    refund_requested_at = models.DateTimeField(null=True, blank=True)
    refund_reason = models.TextField(null=True, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)
    # Thời điểm học viên chính thức đăng ký (sau khi thanh toán)
    enrolled_at = models.DateTimeField(null=True, blank=True)
    access_granted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'enrollment'
        unique_together = ('student', 'course')  # Mỗi học viên chỉ đăng ký 1 lần
        indexes = [
            models.Index(fields=['student', 'status']),  # Lọc đăng ký của học viên theo trạng thái
            models.Index(fields=['course', 'status']),   # Lọc học viên của khóa học theo trạng thái
        ]

    def __str__(self):
        return f"{self.student.email} - {self.course.title} ({self.status})"


class LessonProgress(models.Model):
    """
    Tiến độ bài học - ghi nhận học viên đã hoàn thành bài học nào.
    """
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey('lessons.Lesson', on_delete=models.CASCADE, related_name='progress')
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lesson_progress'
        unique_together = ('enrollment', 'lesson')  # Mỗi enrollment chỉ có 1 progress cho mỗi lesson


class CourseProgress(models.Model):
    """
    Tiến độ khóa học - tổng hợp tiến độ học tập của học viên trong khóa học.
    """
    enrollment = models.OneToOneField(Enrollment, on_delete=models.CASCADE, related_name='progress')
    completed_lessons_count = models.IntegerField(default=0)
    total_lessons_count = models.IntegerField(default=0)
    progress_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    last_completed_lesson = models.ForeignKey('lessons.Lesson', on_delete=models.SET_NULL, null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_activity_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'course_progress'

    def __str__(self):
        return f"Progress {self.enrollment}: {self.progress_percent}%"
