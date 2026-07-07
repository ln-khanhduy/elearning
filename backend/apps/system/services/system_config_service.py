"""SystemConfigService - Quản lý cấu hình hệ thống."""
from rest_framework.exceptions import ValidationError
from apps.system.models import SystemConfig

DEFAULT_CONFIGS = {
    "platform_fee_percent": {
        "value": "20",
        "description": "Phí nền tảng (%)",
    },
    "instructor_share_percent": {
        "value": "80",
        "description": "Chia cho giảng viên (%)",
    },
    "tax_percent": {
        "value": "10",
        "description": "Thuế (%)",
    },
    "payment_fee_percent": {
        "value": "2.5",
        "description": "Phí thanh toán (%)",
    },
}


def get_all_configs():
    """Lấy tất cả config, nếu chưa có thì tạo default."""
    configs = {}
    for key, default in DEFAULT_CONFIGS.items():
        obj, created = SystemConfig.objects.get_or_create(
            key=key,
            defaults={"value": default["value"], "description": default["description"]},
        )
        configs[key] = {
            "key": obj.key,
            "value": obj.value,
            "description": obj.description,
            "updated_at": obj.updated_at,
        }
    return configs


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
    Validate: platform_fee_percent + instructor_share_percent = 100
    """
    pf = configs.get("platform_fee_percent")
    ins = configs.get("instructor_share_percent")

    if pf is not None and ins is not None:
        total = float(pf) + float(ins)
        if abs(total - 100) > 0.01:
            raise ValidationError({
                "detail": "Phí nền tảng và chia cho giảng viên phải cộng lại bằng 100%."
            })

    results = {}
    for key, value in configs.items():
        if key in DEFAULT_CONFIGS:
            results[key] = update_config(key, value, updated_by)
    return results