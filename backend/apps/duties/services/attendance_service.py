"""AttendanceService - Nghiệp vụ chấm công cho giảng viên."""
import math
from datetime import datetime, timedelta

from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.duties.models import DutySchedule, InstructorAttendanceLog
from apps.duties.repositories import duty_repository
from apps.duties.services.config import _cfg


def _tz(dt):
    """Chuyển datetime naive -> aware theo timezone hiện tại."""
    if dt.tzinfo is None:
        return timezone.make_aware(dt)
    return dt


def auto_checkout_due_logs(user):
    """Tự động check-out các log đã đủ duration mà giảng viên chưa logout."""
    now = timezone.now()
    open_logs = duty_repository.list_open_attendance_logs(user)
    for log in open_logs:
        counter_start = log.counter_start
        if not counter_start:
            counter_start = _tz(datetime.combine(log.schedule.date, log.schedule.start_time))
        counter_start = _tz(counter_start)
        due = counter_start + timedelta(minutes=log.schedule.duration_minutes)
        if now >= due:
            log_logout(user, log.schedule, logout_dt=due)


def create_attendance(user, schedule):
    """Tạo chấm công khi giảng viên đăng nhập trong ca (login).

    Ràng buộc:
    - Mỗi ca chỉ được check-in DUY NHẤT một lần.
    - Chỉ check-in ca đang ở trạng thái SCHEDULED.
    - Chỉ check-in đúng ngày có ca.
    - Không check-in trễ quá duty_checkin_grace_minutes (mặc định 30 phút).
    """
    now = timezone.now()
    s_start = _tz(datetime.combine(schedule.date, schedule.start_time))
    s_end = s_start + timedelta(minutes=schedule.duration_minutes)

    if schedule.status != DutySchedule.Status.SCHEDULED:
        raise ValidationError("Ca trực không ở trạng thái có thể check-in.")

    if duty_repository.has_attendance_log(user, schedule):
        raise ValidationError("Ca trực này đã được check-in trước đó. Mỗi ca chỉ check-in/check-out 1 lần.")

    if now.date() != schedule.date:
        raise ValidationError(
            f"Ca trực thuộc ngày {schedule.date}. Hôm nay ({now.date()}) không thể check-in."
        )

    grace = _cfg("duty_checkin_grace_minutes", 30)
    if now > s_start + timedelta(minutes=grace):
        late_minutes = int((now - s_start).total_seconds() // 60)
        _notify_missed_duty(user, schedule, now, late_minutes, grace)
        raise ValidationError(
            f"Đã quá giờ kiểm tra (trễ {late_minutes} phút, giới hạn {grace} phút). "
            f"Bạn đã bỏ lỡ ca — hãy báo INSTRUCTOR_MANAGER để sắp lịch bù."
        )

    if now >= s_end:
        raise ValidationError("Ca trực đã kết thúc, không thể check-in.")

    counter_start = max(s_start, now)
    return duty_repository.create_attendance_log(
        schedule=schedule, instructor=user, login_at=now, counter_start=counter_start,
    )


def _notify_missed_duty(user, schedule, now, late_minutes, grace):
    """Gửi notification realtime khi giảng viên bỏ lỡ ca (không check-in đúng giờ)."""
    from apps.notifications.repositories import notification_repository
    from apps.notifications.models import Notification
    from django.contrib.auth import get_user_model

    body = (
        f"Bạn đã bỏ lỡ ca trực {schedule.get_shift_display()} ngày {schedule.date} "
        f"({schedule.start_time} – {schedule.end_time()}). "
        f"Bạn đến trễ {late_minutes} phút (quá giới hạn {grace} phút) nên không thể check-in. "
        f"Vui lòng báo INSTRUCTOR_MANAGER để sắp lịch bù."
    )
    try:
        notification_repository.create(
            recipient=user,
            title="Bỏ lỡ ca trực - cần sắp bù",
            body=body,
            notification_type=Notification.Type.SYSTEM,
            channel=Notification.Channel.IN_APP,
        )
    except Exception:
        pass

    User = get_user_model()
    managers = User.objects.filter(role__code__in=["USER_MANAGER", "INSTRUCTOR_MANAGER"], is_active=True)
    for m in managers:
        try:
            notification_repository.create(
                recipient=m,
                title=f"[Quản lý] {user.get_full_name() or user.email} bỏ lỡ ca trực",
                body=body,
                notification_type=Notification.Type.SYSTEM,
                channel=Notification.Channel.IN_APP,
            )
        except Exception:
            pass


def log_logout(user, schedule, logout_dt=None):
    """Kết thúc ca: tính số phút đếm + trạng thái + số phút thiếu."""
    now = _tz(logout_dt or timezone.now())
    log = duty_repository.get_open_attendance_log(user, schedule)
    if not log:
        if duty_repository.has_attendance_log(user, schedule):
            raise ValidationError("Ca trực này đã được check-out trước đó. Mỗi ca chỉ check-in/check-out 1 lần.")
        return None

    log.logout_at = now
    compute_attendance_minutes(log, schedule, now)

    if log.missing_minutes > 0:
        _send_makeup_notification(log)

    if schedule.status == DutySchedule.Status.SCHEDULED:
        schedule.status = DutySchedule.Status.DONE
        schedule.save(update_fields=["status", "updated_at"])

    return log


def compute_attendance_minutes(log, schedule, logout_dt=None):
    """Tính lại counted_minutes / actual_minutes / status / missing_minutes cho 1 log chấm công.

    Công thức:
    - Bộ đếm bắt đầu = max(giờ bắt đầu ca, thời điểm login).
    - Bộ đếm kết thúc = min(thời điểm logout, giờ kết thúc ca). Đủ 120p thì auto dừng.
    - counted_minutes = max(0, end - start) (≤ duration).
    - actual_minutes = logout - login (thời gian online thực tế).
    - missing = duration - actual_minutes; nếu missing < grace (15p) thì = 0, ngược lại = đủ số thiếu.
    - Trạng thái: LATE / EARLY_LEAVE / LATE_EARLY (nếu cả 2) / OK.
    """
    now = _tz(logout_dt or timezone.now())
    s_start = _tz(datetime.combine(schedule.date, schedule.start_time))
    duration = schedule.duration_minutes

    counter_start = max(s_start, _tz(log.login_at))
    counter_end = min(now, counter_start + timedelta(minutes=duration))
    counted = max(0, int((counter_end - counter_start).total_seconds() // 60))
    counted = min(counted, duration)

    actual_seconds = max(0, int((now - _tz(log.login_at)).total_seconds()))
    actual = actual_seconds // 60

    late_minutes = max(0, int((_tz(log.login_at) - s_start).total_seconds() // 60))
    early_minutes = max(0, int((counter_start + timedelta(minutes=duration) - now).total_seconds() // 60))

    late_th = _cfg("duty_late_penalty_minutes", 10)
    late = late_minutes > late_th
    early = early_minutes > late_th

    if late and early:
        log.status = InstructorAttendanceLog.Status.LATE_EARLY
    elif late:
        log.status = InstructorAttendanceLog.Status.LATE
    elif early:
        log.status = InstructorAttendanceLog.Status.EARLY_LEAVE
    else:
        log.status = InstructorAttendanceLog.Status.OK

    grace = _cfg("duty_grace_minutes", 15)
    missing_seconds = max(0, duration * 60 - actual_seconds)
    if missing_seconds < grace * 60:
        log.missing_minutes = 0
    else:
        log.missing_minutes = math.ceil(missing_seconds / 60)

    log.counter_start = counter_start
    log.counter_end = counter_end
    log.counted_minutes = counted
    log.actual_minutes = actual
    log.save()
    return log


def _send_makeup_notification(log):
    """Thông báo thiếu giờ trực (realtime) khi check-out sớm/trễ - cần sắp lịch bù."""
    from apps.notifications.repositories import notification_repository
    from apps.notifications.models import Notification
    from django.contrib.auth import get_user_model

    schedule = log.schedule
    body = (
        f"Ca trực {schedule.get_shift_display()} ngày {schedule.date} "
        f"({schedule.start_time} – {schedule.end_time()}): "
        f"trực {log.counted_minutes} phút, thiếu {log.missing_minutes} phút. "
        f"Cần báo INSTRUCTOR_MANAGER để sắp lịch bù."
    )

    try:
        notification_repository.create(
            recipient=log.instructor,
            title="Thiếu giờ trực - cần bù lịch",
            body=body,
            notification_type=Notification.Type.SYSTEM,
            channel=Notification.Channel.IN_APP,
        )
    except Exception:
        pass

    User = get_user_model()
    managers = User.objects.filter(role__code__in=["USER_MANAGER", "INSTRUCTOR_MANAGER"], is_active=True)
    for m in managers:
        try:
            notification_repository.create(
                recipient=m,
                title=f"[Quản lý] {log.instructor.get_full_name() or log.instructor.email} thiếu giờ trực",
                body=body,
                notification_type=Notification.Type.SYSTEM,
                channel=Notification.Channel.IN_APP,
            )
        except Exception:
            pass