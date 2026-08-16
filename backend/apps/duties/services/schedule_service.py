"""ScheduleService - Nghiệp vụ lịch trực cho giảng viên."""
from datetime import datetime, timedelta

from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.duties.models import DutySchedule
from apps.duties.repositories import duty_repository
from apps.duties.services.config import SHIFT_START_TIMES, _cfg, _parse_time, _validate_shift_time


def list_schedules(user, instructor_id=None, date_from=None, date_to=None):
    """Danh sách lịch trực (theo giảng viên / khoảng ngày)."""
    if instructor_id and str(user.id) == str(instructor_id):
        notify_missed_schedules(user)
    return duty_repository.list_schedules(
        instructor_id=instructor_id, date_from=date_from, date_to=date_to,
    )


def _resolve_date(value):
    """Chuyển ngày chuỗi/datetime -> date."""
    if isinstance(value, datetime):
        return value.date()
    return datetime.strptime(str(value), "%Y-%m-%d").date()


def _validate_no_overlap(existing, start_dt, end_dt, min_gap_minutes):
    """Kiểm tra ca không trùng giờ / giãn cách tối thiểu."""
    for s in existing:
        s_start = datetime.combine(s.date, s.start_time)
        s_end = s_start + timedelta(minutes=s.duration_minutes)
        if not (end_dt <= s_start + timedelta(minutes=min_gap_minutes)
                or s_end + timedelta(minutes=min_gap_minutes) <= start_dt):
            raise ValidationError("Ca trực bị trùng giờ hoặc không đủ giãn cách 30 phút với ca khác.")


def create_schedule(user, instructor_id, date, shift, start_time=None, end_time=None, makeup_for_id=None):
    """Tạo lịch trực - kiểm tra ràng buộc.

    - start_time/end_time (HH:MM) nếu được truyền sẽ ghi đè giờ mặc định của ca.
    - makeup_for_id: ID ca gốc bị thiếu giờ -> tạo CA BÙ, duration = số phút thiếu.
    """
    from django.contrib.auth import get_user_model

    User = get_user_model()
    instructor = User.objects.filter(id=instructor_id).first()
    if not instructor:
        raise ValidationError("Giảng viên không tồn tại.")

    if shift not in SHIFT_START_TIMES:
        raise ValidationError("Ca không hợp lệ.")

    date_obj = _resolve_date(date)

    # Nếu là ca bù: duration = số phút thiếu của ca gốc
    schedule_type = DutySchedule.Type.NORMAL
    makeup_for = None
    duration = None
    if makeup_for_id:
        makeup_for = duty_repository.get_schedule_by_id(makeup_for_id)
        if not makeup_for or str(makeup_for.instructor_id) != str(instructor_id):
            raise ValidationError("Ca gốc cần bù không tồn tại.")
        if makeup_for.status != DutySchedule.Status.DONE:
            raise ValidationError("Chỉ ca đã hoàn thành (có chấm công) mới được bù.")
        log = duty_repository.get_best_attendance_log(makeup_for, instructor)
        grace_minutes = _cfg("duty_grace_minutes", 15)
        if not log or log.missing_minutes < grace_minutes:
            raise ValidationError(f"Ca gốc không có phút thiếu (>= {grace_minutes} phút) để bù.")
        schedule_type = DutySchedule.Type.MAKEUP
        duration = log.missing_minutes

    start = _parse_time(start_time) if start_time is not None else SHIFT_START_TIMES[shift]

    if duration is None:
        if end_time is not None:
            end = _parse_time(end_time)
            if end <= start:
                raise ValidationError("Giờ kết thúc phải sau giờ bắt đầu.")
            duration = max(1, int((datetime.combine(date_obj, end) - datetime.combine(date_obj, start)).total_seconds() // 60))
        else:
            duration = _cfg("duty_min_duration_minutes", 120)

    if duration <= 0:
        raise ValidationError("Thời lượng ca phải lớn hơn 0 phút.")

    # Ca không được kéo dài qua nửa đêm
    end_dt = datetime.combine(date_obj, start) + timedelta(minutes=duration)
    if end_dt.date() != date_obj:
        raise ValidationError("Giờ kết thúc không được sang ngày hôm sau.")
    end = end_dt.time()
    _validate_shift_time(shift, start, end)

    existing = duty_repository.list_schedules_for_instructor(
        instructor_id=instructor_id, date=date_obj, status=DutySchedule.Status.SCHEDULED,
    )
    max_hours_per_day = _cfg("duty_max_hours_per_day", 8)
    total_minutes = sum(s.duration_minutes for s in existing) + duration
    if total_minutes > max_hours_per_day * 60:
        raise ValidationError(
            f"Tổng thời lượng trực trong ngày tối đa {max_hours_per_day} giờ "
            f"(hiện tại {total_minutes // 60}h{total_minutes % 60}p)."
        )

    max_small_shifts_per_big_shift = _cfg("duty_max_small_shifts_per_big_shift", 2)
    same_shift_count = existing.filter(shift=shift).count()
    if same_shift_count >= max_small_shifts_per_big_shift:
        raise ValidationError(f"Ca {shift} chỉ được chia tối đa {max_small_shifts_per_big_shift} ca nhỏ.")

    _validate_no_overlap(existing, datetime.combine(date_obj, start), end_dt, _cfg("duty_min_gap_minutes", 30))

    return duty_repository.create_schedule(
        instructor=instructor, date=date_obj, shift=shift, start_time=start,
        duration_minutes=duration, scheduled_by=user,
        schedule_type=schedule_type, makeup_for=makeup_for,
    )


def update_schedule(user, schedule_id, data):
    """Cập nhật ca trực (ngày/ca/giờ bắt đầu/giờ kết thúc)."""
    schedule = duty_repository.get_schedule_by_id(schedule_id)
    if not schedule:
        raise ValidationError("Không tìm thấy ca trực.")
    if schedule.status != DutySchedule.Status.SCHEDULED:
        raise ValidationError("Chỉ ca đang sắp lịch mới được sửa.")
    if schedule.schedule_type == DutySchedule.Type.MAKEUP:
        raise ValidationError("Ca bù không được sửa. Hãy hủy và tạo lại.")

    date_obj = _resolve_date(data["date"]) if data.get("date") else schedule.date
    shift = data.get("shift", schedule.shift)
    if shift not in SHIFT_START_TIMES:
        raise ValidationError("Ca không hợp lệ.")

    start = _parse_time(data["start_time"]) if data.get("start_time") else schedule.start_time
    if data.get("end_time"):
        end = _parse_time(data["end_time"])
        if end <= start:
            raise ValidationError("Giờ kết thúc phải sau giờ bắt đầu.")
        duration = max(1, int((datetime.combine(date_obj, end) - datetime.combine(date_obj, start)).total_seconds() // 60))
    else:
        duration = schedule.duration_minutes

    if duration <= 0:
        raise ValidationError("Thời lượng ca phải lớn hơn 0 phút.")

    end_dt = datetime.combine(date_obj, start) + timedelta(minutes=duration)
    if end_dt.date() != date_obj:
        raise ValidationError("Giờ kết thúc không được sang ngày hôm sau.")
    end = end_dt.time()
    _validate_shift_time(shift, start, end)

    existing = duty_repository.list_schedules_for_instructor(
        instructor_id=schedule.instructor_id, date=date_obj,
        status=DutySchedule.Status.SCHEDULED, exclude_id=schedule.id,
    )
    max_small_shifts_per_big_shift = _cfg("duty_max_small_shifts_per_big_shift", 2)
    if existing.filter(shift=shift).count() >= max_small_shifts_per_big_shift:
        raise ValidationError(f"Ca {shift} chỉ được chia tối đa {max_small_shifts_per_big_shift} ca nhỏ.")

    max_hours_per_day = _cfg("duty_max_hours_per_day", 8)
    total_minutes = sum(s.duration_minutes for s in existing) + duration
    if total_minutes > max_hours_per_day * 60:
        raise ValidationError(
            f"Tổng thời lượng trực trong ngày tối đa {max_hours_per_day} giờ "
            f"(hiện tại {total_minutes // 60}h{total_minutes % 60}p)."
        )

    _validate_no_overlap(existing, datetime.combine(date_obj, start), end_dt, _cfg("duty_min_gap_minutes", 30))

    schedule.date = date_obj
    schedule.shift = shift
    schedule.start_time = start
    schedule.duration_minutes = duration
    schedule.save()
    return schedule


def cancel_schedule(user, schedule_id):
    """Xóa ca trực khỏi DB (hard delete)."""
    schedule = duty_repository.get_schedule_by_id(schedule_id)
    if not schedule:
        raise ValidationError("Không tìm thấy ca trực.")
    _notify_students(schedule, "ca trực đã bị xóa")
    duty_repository.delete_schedule(schedule)
    return schedule


def replace_schedule(user, schedule_id, date, shift):
    """Bù giờ — xóa ca cũ khỏi DB và tạo ca trực thay thế mới."""
    schedule = duty_repository.get_schedule_by_id(schedule_id)
    if not schedule:
        raise ValidationError("Không tìm thấy ca trực.")
    if schedule.status != DutySchedule.Status.SCHEDULED:
        raise ValidationError("Chỉ ca đang sắp lịch mới bù được.")

    duty_repository.delete_schedule(schedule)
    new_schedule = create_schedule(user, schedule.instructor_id, date, shift)
    _notify_students(schedule, "ca trực đã được đổi lịch bù")
    return {"old": schedule, "new": new_schedule}


def _notify_students(schedule, message, reason=None):
    """Thông báo cho học viên khóa mà giảng viên phụ trách."""
    from apps.notifications.models import Notification

    try:
        from apps.enrollments.models import Enrollment
        course_ids = list(schedule.instructor.teaching_courses.values_list("id", flat=True))
        students = set(
            Enrollment.objects.filter(course_id__in=course_ids).values_list("student_id", flat=True)
        )
        for sid in students:
            Notification.objects.create(
                recipient_id=sid,
                title="Thông báo lịch trực",
                body=f"Giảng viên {schedule.instructor.get_full_name() or schedule.instructor.email}: "
                     f"{message}{f' ({reason})' if reason else ''}.",
                notification_type=Notification.Type.COURSE,
                channel=Notification.Channel.IN_APP,
                send_status=Notification.SendStatus.SENT,
            )
    except Exception:
        pass


def notify_missed_schedules(user):
    """Quét ca bỏ lỡ + tự checkout ca đủ giờ, rồi gửi thông báo realtime 1 lần."""
    from apps.duties.services.attendance_service import auto_checkout_due_logs, _notify_missed_duty

    auto_checkout_due_logs(user)

    now = timezone.now()
    grace = _cfg("duty_checkin_grace_minutes", 30)
    schedules = duty_repository.list_missed_notified_schedules(user)
    for schedule in schedules:
        s_start = datetime.combine(schedule.date, schedule.start_time)
        if s_start.tzinfo is None:
            s_start = timezone.make_aware(s_start)
        if now >= s_start + timedelta(minutes=grace):
            late_minutes = int((now - s_start).total_seconds() // 60)
            _notify_missed_duty(user, schedule, now, late_minutes, grace)
            schedule.missed_notified = True
            schedule.save(update_fields=["missed_notified", "updated_at"])