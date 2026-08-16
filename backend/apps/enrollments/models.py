from django.conf import settings
from django.db import models


class Enrollment(models.Model):
    """
    Đăng ký khóa học - ghi nhận học viên đã mua/đăng ký khóa học.
    (R2) Mỗi lần mua tạo Enrollment mới; bỏ unique (student, course);
    hết hạn -> status EXPIRED.
    """
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        COMPLETED = 'COMPLETED', 'Completed'
        EXPIRED = 'EXPIRED', 'Expired'  # hết hạn truy cập

    # Học viên (User) đã đăng ký khóa học
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='enrollments')
    # Khóa học được đăng ký
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='enrollments')
    # Giao dịch thanh toán tương ứng với đăng ký này (một đăng ký có thể không có payment nếu là free)
    payment_transaction = models.ForeignKey('payments.PaymentTransaction', on_delete=models.SET_NULL, null=True, blank=True, related_name='enrollments')
    # Trạng thái đăng ký: ACTIVE - đang học, COMPLETED - đã hoàn thành, EXPIRED - hết hạn
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    #Thời điểm hết hạn truy cập (paid_at + duration_days của gói)
    expires_at = models.DateTimeField(null=True, blank=True)
    #Gói đã mua cho enrollment này
    access_plan = models.ForeignKey(
        'courses.CourseAccessPlan',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='enrollments',
    )
    # Thời điểm học viên chính thức đăng ký và được cấp quyền truy cập khóa học (sau khi thanh toán thành công)
    enrolled_at = models.DateTimeField(null=True, blank=True)
    # Thời điểm tạo bản ghi
    created_at = models.DateTimeField(auto_now_add=True)
    # Thời điểm cập nhật bản ghi gần nhất
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'enrollment'
        indexes = [
            models.Index(fields=['student', 'status']),  # Lọc đăng ký của học viên theo trạng thái
            models.Index(fields=['course', 'status']),   # Lọc học viên của khóa học theo trạng thái
            models.Index(fields=['student', 'expires_at']),
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