"""DutyRepository - Truy cập DB cho Lịch trực & Chấm công."""
from apps.duties.models import DutySchedule, InstructorAttendanceLog


# ==================== LỊCH TRỰC ====================

def list_schedules(instructor_id=None, date_from=None, date_to=None):
    """Danh sách lịch trực (lọc theo giảng viên / khoảng ngày)."""
    qs = DutySchedule.objects.select_related("instructor").order_by("date", "start_time")
    if instructor_id:
        qs = qs.filter(instructor_id=instructor_id)
    if date_from:
        qs = qs.filter(date__gte=date_from)
    if date_to:
        qs = qs.filter(date__lte=date_to)
    return qs


def get_schedule_by_id(schedule_id):
    """Lấy lịch trực theo ID."""
    return DutySchedule.objects.filter(id=schedule_id).first()


def list_schedules_for_instructor(instructor_id, date=None, status=None, exclude_id=None):
    """Lịch trực của 1 giảng viên trong ngày (loại trừ 1 ca nếu cần)."""
    qs = DutySchedule.objects.filter(instructor_id=instructor_id)
    if date:
        qs = qs.filter(date=date)
    if status:
        qs = qs.filter(status=status)
    if exclude_id:
        qs = qs.exclude(id=exclude_id)
    return qs


def list_makeup_schedules_for(original_schedule, statuses=None):
    """Danh sách ca bù của 1 ca gốc."""
    qs = DutySchedule.objects.filter(makeup_for=original_schedule)
    if statuses:
        qs = qs.filter(status__in=statuses)
    return qs


def create_schedule(**kwargs):
    """Tạo lịch trực."""
    return DutySchedule.objects.create(**kwargs)


def delete_schedule(schedule):
    """Xóa lịch trực."""
    return schedule.delete()


# ==================== CHẤM CÔNG ====================

def get_open_attendance_log(instructor, schedule):
    """Lấy log chấm công đang mở (chưa logout) của 1 ca."""
    return InstructorAttendanceLog.objects.filter(
        instructor=instructor, schedule=schedule, logout_at__isnull=True
    ).order_by("-login_at").first()


def get_best_attendance_log(schedule, instructor):
    """Lấy log chấm công gần nhất của ca."""
    return InstructorAttendanceLog.objects.filter(
        schedule=schedule, instructor=instructor
    ).order_by("-login_at").first()


def has_attendance_log(instructor, schedule):
    """Kiểm tra ca đã có log chấm công."""
    return InstructorAttendanceLog.objects.filter(
        instructor=instructor, schedule=schedule
    ).exists()


def create_attendance_log(**kwargs):
    """Tạo log chấm công."""
    return InstructorAttendanceLog.objects.create(**kwargs)


def list_open_attendance_logs(user):
    """Các log chấm công đang mở của giảng viên có ca trực."""
    return InstructorAttendanceLog.objects.filter(
        instructor=user, logout_at__isnull=True, schedule__isnull=False
    ).select_related("schedule")


def list_missed_notified_schedules(user):
    """Các ca chưa thông báo bỏ lỡ của giảng viên."""
    return DutySchedule.objects.filter(
        instructor=user, status=DutySchedule.Status.SCHEDULED, missed_notified=False
    )


def sum_counted_minutes(instructor_id, year=None, month=None, statuses=None):
    """Tổng số phút được đếm của giảng viên trong tháng."""
    from django.db.models import Sum

    qs = InstructorAttendanceLog.objects.filter(instructor_id=instructor_id)
    if year:
        qs = qs.filter(login_at__year=year)
    if month:
        qs = qs.filter(login_at__month=month)
    if statuses:
        qs = qs.filter(status__in=statuses)
    return qs.aggregate(s=Sum("counted_minutes"))["s"] or 0


def list_attendance_logs_for_payment(instructor_id, year, month, statuses):
    """Log chấm công hợp lệ để tính lương."""
    return InstructorAttendanceLog.objects.filter(
        instructor_id=instructor_id,
        status__in=statuses,
        login_at__year=year,
        login_at__month=month,
    )


def list_missing_hours_logs(instructor_id, month=None, min_missing_minutes=0):
    """Log thiếu giờ chưa bù."""
    qs = InstructorAttendanceLog.objects.filter(
        instructor_id=instructor_id,
        missing_minutes__gte=min_missing_minutes,
    )
    if month:
        qs = qs.filter(
            login_at__year=int(month[:4]),
            login_at__month=int(month[5:7]),
        )
    return qs
