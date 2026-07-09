from decimal import Decimal
from apps.system.models import SystemConfig


def get_decimal(key, default=Decimal("0")):
    """Lấy giá trị config dạng Decimal từ SystemConfig."""
    try:
        cfg = SystemConfig.objects.filter(key=key).first()
        return Decimal(cfg.value) if cfg else Decimal(str(default))
    except Exception:
        return Decimal(str(default))