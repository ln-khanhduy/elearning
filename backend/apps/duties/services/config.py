"""Cấu hình & tiện ích dùng chung cho app duties."""
from datetime import datetime, time as dtime

from rest_framework.exceptions import ValidationError

from apps.system.repositories import system_config_repository


# ==================== CẤU HÌNH ====================

def _cfg(key, default):
    try:
        return int(system_config_repository.get_decimal(key, str(default)))
    except Exception:
        return default


def _parse_time(value):
    """Parse 'HH:MM' hoặc time -> time object."""
    if isinstance(value, dtime):
        return value
    if isinstance(value, str):
        try:
            h, m = value.strip().split(":")
            return dtime(int(h), int(m))
        except Exception:
            raise ValidationError("Giờ phải có định dạng HH:MM.")
    raise ValidationError("Giờ không hợp lệ.")


# Khung giờ chuẩn của từng ca trực và thời lượng tối đa
SHIFT_BOUNDS = {
    "SANG": (dtime(7, 0), dtime(11, 30)),
    "CHIEU": (dtime(13, 0), dtime(17, 30)),
    "TOI": (dtime(19, 0), dtime(23, 30)),
}
SHIFT_START_TIMES = {k: v[0] for k, v in SHIFT_BOUNDS.items()}


def _time_to_minutes(t):
    """time/str -> số phút trong ngày."""
    if isinstance(t, str):
        t = _parse_time(t)
    return t.hour * 60 + t.minute


def _validate_shift_time(shift, start, end, max_duration_minutes=None):
    """Kiểm tra ca trực nằm trong khung giờ chuẩn.

    - Giờ bắt đầu >= giờ mở ca (VD sáng 07:00)
    - Giờ kết thúc <= giờ đóng ca (VD sáng 11:30)
    - Giờ kết thúc > giờ bắt đầu
    - Thời lượng <= max_duration_minutes (mặc định đọc từ config DB)
    """
    if shift not in SHIFT_BOUNDS:
        raise ValidationError("Ca không hợp lệ.")

    shift_start, shift_end = SHIFT_BOUNDS[shift]
    start_min = _time_to_minutes(start)
    end_min = _time_to_minutes(end)

    shift_start_min = shift_start.hour * 60 + shift_start.minute
    shift_end_min = shift_end.hour * 60 + shift_end.minute

    if start_min < shift_start_min:
        raise ValidationError(
            f"Giờ bắt đầu ({start:%H:%M}) phải từ {shift_start:%H:%M} trở đi trong ca này."
        )
    if end_min > shift_end_min:
        raise ValidationError(
            f"Giờ kết thúc ({end:%H:%M}) phải trước hoặc bằng {shift_end:%H:%M} trong ca này."
        )
    if start_min >= end_min:
        raise ValidationError("Giờ kết thúc phải sau giờ bắt đầu.")
    if max_duration_minutes is None:
        max_duration_minutes = _cfg("duty_min_duration_minutes", 120)
    if end_min - start_min > max_duration_minutes:
        raise ValidationError(
            f"Mỗi ca trực tối đa {int(max_duration_minutes) // 60} tiếng ({int(max_duration_minutes)} phút)."
        )