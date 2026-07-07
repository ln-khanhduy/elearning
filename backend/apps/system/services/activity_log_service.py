"""ActivityLogService - Quản lý nhật ký hoạt động."""
from django.utils import timezone
from datetime import timedelta
from apps.system.models import AdminActivityLog


def get_logs(action_type=None, date=None, page=1, page_size=10):
    """
    Lấy danh sách log với filter và phân trang.
    - action_type: lọc theo loại hành động
    - date: lọc theo ngày (YYYY-MM-DD)
    - page, page_size: phân trang
    """
    qs = AdminActivityLog.objects.select_related("admin").all()

    if action_type:
        qs = qs.filter(action_type=action_type)

    if date:
        try:
            d = timezone.datetime.strptime(str(date), "%Y-%m-%d").date()
            qs = qs.filter(created_at__date=d)
        except ValueError:
            pass

    qs = qs.order_by("-created_at")

    from django.core.paginator import Paginator, EmptyPage
    paginator = Paginator(qs, page_size)
    total = paginator.count
    total_pages = paginator.num_pages
    try:
        page_obj = paginator.page(page)
    except EmptyPage:
        page_obj = paginator.page(paginator.num_pages)

    return {
        "results": list(page_obj.object_list),
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_action_types():
    """Lấy danh sách các loại hành động đã từng xuất hiện."""
    return (
        AdminActivityLog.objects.values_list("action_type", flat=True)
        .distinct()
        .order_by("action_type")
    )