from apps.system.models import AdminActivityLog
def log(admin, action_type, detail, target_type=None, target_id=None):
    """
    Ghi một bản ghi admin activity log.

    Args:
        admin: User object - admin thực hiện hành động
        action_type: str - mã hành động (VD: 'USER_LOCK', 'INSTRUCTOR_APPROVE')
        detail: str - mô tả chi tiết hành động
        target_type: str - Loại đối tượng (optional)
        target_id: str - ID của đối tượng bị tác động (optional)
    """
    return AdminActivityLog.objects.create(
        admin=admin,
        action_type=action_type,
        detail=detail,
        target_type=target_type or '',
        target_id=str(target_id) if target_id else '',
    )
def get_logs(limit=100, action_type=None, admin_id=None):
    """Lấy danh sách admin logs, có thể lọc theo action_type hoặc admin."""
    qs = AdminActivityLog.objects.select_related('admin').all()
    if action_type:
        qs = qs.filter(action_type=action_type)
    if admin_id:
        qs = qs.filter(admin_id=admin_id)
    return qs[:limit]
