import uuid6

from django.conf import settings
from django.db import models


class DutySchedule(models.Model):
    """
    Lịch trực của giảng viên - mỗi giảng viên có lịch trực riêng.
    KHÔNG gán khóa vào ca trực: giảng viên trực có thể trả lời mọi khóa
    mà mình được phân công giảng dạy (Course.assigned_instructor).
    """

    class Shift(models.TextChoices):
        SANG = "SANG", "Ca sáng (7h-11h30)"
        CHIEU = "CHIEU", "Ca chiều (13h-17h30)"
        TOI = "TOI", "Ca tối (19h-23h30)"

    class Status(models.TextChoices):
        SCHEDULED = "SCHEDULED", "Đã sắp lịch"
        DONE = "DONE", "Hoàn thành"

    class Type(models.TextChoices):
        NORMAL = "NORMAL", "Ca trực thường"
        MAKEUP = "MAKEUP", "Ca bù"

    id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="duty_schedules",
    )
    date = models.DateField()
    shift = models.CharField(max_length=20, choices=Shift.choices)
    start_time = models.TimeField()  # giờ bắt đầu ca (VD 07:00)
    duration_minutes = models.PositiveIntegerField(default=120)  # cố định 120p
    scheduled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="scheduled_duties",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    # Loại ca: thường hoặc ca bù (bù phút thiếu từ ca trước)
    schedule_type = models.CharField(max_length=20, choices=Type.choices, default=Type.NORMAL)
    # Ca gốc bị thiếu giờ (nếu là ca bù)
    makeup_for = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="makeup_schedules",
    )
    # Đã gửi thông báo "bỏ lỡ ca" cho giảng viên chưa (tránh gửi lặp)
    missed_notified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "duty_schedule"
        ordering = ["date", "start_time"]
        indexes = [
            models.Index(fields=["instructor", "date"]),
            models.Index(fields=["date", "shift"]),
        ]

    def __str__(self):
        return f"{self.instructor_id} - {self.date} {self.get_shift_display()}"

    def end_time(self):
        """Kết thúc theo khung chuẩn = start_time + duration_minutes."""
        from datetime import datetime, timedelta

        dt = datetime.combine(self.date, self.start_time) + timedelta(minutes=self.duration_minutes)
        return dt.time()


class InstructorAttendanceLog(models.Model):
    """
    Chấm công giảng viên theo cơ chế đơn giản Login/Logout (KHÔNG Heartbeat).
    Bộ đếm: bắt đầu khi đến giờ bắt đầu ca + đã login;
    dừng khi logout; đủ 120p thì không đếm nữa; reset mỗi ca.
    """

    class Status(models.TextChoices):
        OK = "OK", "Bình thường"
        LATE = "LATE", "Đăng nhập trễ"
        EARLY_LEAVE = "EARLY_LEAVE", "Đăng xuất sớm"
        LATE_EARLY = "LATE_EARLY", "Đăng nhập trễ & đăng xuất sớm"
        NOT_IN_SCHEDULE = "NOT_IN_SCHEDULE", "Đăng nhập ngoài lịch trực"

    id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)
    schedule = models.ForeignKey(
        DutySchedule,
        on_delete=models.CASCADE,
        related_name="attendance_logs",
        null=True,
        blank=True,
    )
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="attendance_logs",
    )
    # Thời điểm đăng nhập/đăng xuất thực tế
    login_at = models.DateTimeField()
    logout_at = models.DateTimeField(null=True, blank=True)
    # Bộ đếm: thời điểm bắt đầu/kết thúc đếm
    counter_start = models.DateTimeField(null=True, blank=True)
    counter_end = models.DateTimeField(null=True, blank=True)
    # Số phút được đếm (≤ 120) — dùng tính lương
    counted_minutes = models.PositiveIntegerField(default=0)
    # Số phút thực tế online
    actual_minutes = models.PositiveIntegerField(default=0)
    # Trạng thái chấm công
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.OK)
    # Số phút thiếu so với thời lượng chuẩn của ca (>= 15 phút thì cần bù)
    missing_minutes = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "instructor_attendance_log"
        ordering = ["-login_at"]
        indexes = [
            models.Index(fields=["instructor", "login_at"]),
        ]

    def __str__(self):
        return f"Attendance {self.instructor_id} @ {self.login_at} ({self.status})"


class InstructorPayment(models.Model):
    """
    Bảng lương giảng viên theo tháng.
    SUPERADMIN tạo/rà soát, duyệt và thanh toán bảng lương.
    """

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Nháp"
        APPROVED = "APPROVED", "Đã duyệt"
        PAID = "PAID", "Đã chi trả"
        CANCELLED = "CANCELLED", "Đã hủy"

    id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="instructor_payments",
    )
    month = models.CharField(max_length=7)  # YYYY-MM (VD 2026-07)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    # Tổng hợp giờ
    regular_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)  # ≤30h
    overtime_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)  # giờ 31-40
    total_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    # Tiền
    regular_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    overtime_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    salary_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)   # Lương = regular + overtime
    net_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # Thực nhận = Lương + Thưởng - Phạt (cột động)
    # Ghi chú / đối soát
    note = models.TextField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_instructor_payments",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_instructor_payments",
    )
    paid_at = models.DateTimeField(null=True, blank=True)
    # Stripe Transfer ID khi đã thực sự chuyển tiền cho giảng viên
    provider_transfer_id = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "instructor_payment"
        ordering = ["-month"]
        unique_together = ("instructor", "month")

    def __str__(self):
        return f"Lương {self.instructor_id} - {self.month} ({self.status})"


class InstructorPaymentColumn(models.Model):
    """Cột động TOÀN CỤC trong bảng lương (VD: Chuyên cần, Phạt trễ...)."""
    class Type(models.TextChoices):
        BONUS = "BONUS", "Thưởng (+)"
        DEDUCTION = "DEDUCTION", "Khấu trừ (-)"

    id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)
    name = models.CharField(max_length=255, unique=True)
    column_type = models.CharField(max_length=20, choices=Type.choices, default=Type.BONUS)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "instructor_payment_column"
        ordering = ["created_at"]

    def __str__(self):
        return self.name


class InstructorPaymentColumnValue(models.Model):
    """Giá trị của 1 cột động cho 1 bảng lương cụ thể."""
    id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)
    payment = models.ForeignKey(InstructorPayment, on_delete=models.CASCADE, related_name="column_values")
    column = models.ForeignKey(InstructorPaymentColumn, on_delete=models.CASCADE, related_name="values")
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "instructor_payment_column_value"
        unique_together = ("payment", "column")
        ordering = ["column__created_at"]

    def __str__(self):
        return f"{self.payment_id} - {self.column.name}: {self.amount}"


class InstructorPaymentDetail(models.Model):
    """
    Chi tiết bảng lương: từng ca trực tham chiếu.
    """

    id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)
    payment = models.ForeignKey(InstructorPayment, on_delete=models.CASCADE, related_name="details")
    schedule = models.ForeignKey(DutySchedule, on_delete=models.SET_NULL, null=True, blank=True)
    attendance = models.ForeignKey(InstructorAttendanceLog, on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateField()
    shift = models.CharField(max_length=20, choices=DutySchedule.Shift.choices)
    actual_minutes = models.PositiveIntegerField(default=0)
    counted_minutes = models.PositiveIntegerField(default=0)
    missing_minutes = models.PositiveIntegerField(default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reason = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = "instructor_payment_detail"
        ordering = ["date", "shift"]

    def __str__(self):
        return f"{self.payment_id} - {self.date} {self.shift}"