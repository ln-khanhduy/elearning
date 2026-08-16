"""SystemConfigService - Quản lý cấu hình hệ thống."""
from rest_framework.exceptions import ValidationError
from apps.system.models import SystemConfig

# Các key cấu hình dạng số để validate khi cập nhật
NUMERIC_KEYS = {
    "duty_min_teaching_hours",
    "duty_max_teaching_hours",
    "duty_max_hours_per_day",
    "duty_salary_min_rate",
    "duty_salary_overtime_rate",
    "duty_min_duration_minutes",
    "duty_max_shifts_per_day",
    "duty_max_small_shifts_per_big_shift",
    "duty_min_gap_minutes",
    "duty_late_penalty_minutes",
    "duty_grace_minutes",
    "duty_checkin_grace_minutes",
}


def get_all_configs():
    """Lấy tất cả config đang lưu trong DB."""
    return {
        cfg.key: {
            "key": cfg.key,
            "value": cfg.value,
            "description": cfg.description,
            "updated_at": cfg.updated_at,
        }
        for cfg in SystemConfig.objects.all()
    }


def update_config(key, value, updated_by=None):
    """Cập nhật một config."""
    obj = SystemConfig.objects.filter(key=key).first()
    if not obj:
        raise ValidationError({"detail": f"Không tìm thấy cấu hình '{key}'."})

    obj.value = str(value)
    if updated_by:
        obj.updated_by = updated_by
    obj.save()
    return {"key": obj.key, "value": obj.value, "description": obj.description}


def update_configs(configs, updated_by=None):
    """
    Cập nhật nhiều config cùng lúc.
    configs: dict { key: value }
    """
    # Validate các config số (lương + ca trực)
    present = {k: configs[k] for k in NUMERIC_KEYS if k in configs}
    if present:
        for k, v in present.items():
            try:
                fv = float(v)
            except (TypeError, ValueError):
                raise ValidationError({"detail": f"'{k}' phải là một số."})
            if fv < 0:
                raise ValidationError({"detail": f"'{k}' không được âm."})

        min_rate = present.get("duty_salary_min_rate")
        ot_rate = present.get("duty_salary_overtime_rate")
        if min_rate is not None and float(min_rate) <= 0:
            raise ValidationError({"detail": "Tiền lương giờ tối thiểu phải lớn hơn 0."})
        if min_rate is not None and ot_rate is not None and float(ot_rate) < float(min_rate):
            raise ValidationError({"detail": "Tiền lương giờ dạy thêm không được thấp hơn lương giờ tối thiểu."})
        if present.get("duty_min_teaching_hours") is not None and present.get("duty_max_teaching_hours") is not None:
            if float(present["duty_max_teaching_hours"]) < float(present["duty_min_teaching_hours"]):
                raise ValidationError({"detail": "Thời gian tối đa giảng dạy/tháng không được nhỏ hơn tối thiểu."})
        if present.get("duty_max_hours_per_day") is not None and float(present["duty_max_hours_per_day"]) <= 0:
            raise ValidationError({"detail": "Thời gian dạy tối đa/ngày phải lớn hơn 0."})
        if present.get("duty_min_duration_minutes") is not None and float(present["duty_min_duration_minutes"]) <= 0:
            raise ValidationError({"detail": "Thời lượng tối đa mỗi ca phải lớn hơn 0."})
        if present.get("duty_max_shifts_per_day") is not None and float(present["duty_max_shifts_per_day"]) <= 0:
            raise ValidationError({"detail": "Số ca tối đa/ngày phải lớn hơn 0."})
        if present.get("duty_max_small_shifts_per_big_shift") is not None and float(present["duty_max_small_shifts_per_big_shift"]) <= 0:
            raise ValidationError({"detail": "Số ca nhỏ tối đa/khung giờ phải lớn hơn 0."})

    results = {}
    existing_keys = set(SystemConfig.objects.filter(key__in=configs.keys()).values_list("key", flat=True))
    for key, value in configs.items():
        if key in existing_keys:
            results[key] = update_config(key, value, updated_by)
    return results