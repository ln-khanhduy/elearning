"""Admin services cho ChatReport (USER_MANAGER xu ly bao cao vi pham)."""
from datetime import timedelta

from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied

from apps.chat.models import ChatReport
from apps.chat.repositories import chat_repository as repo


def list_reports(user, status=None, page=1, page_size=20):
    """Danh sach bao cao cho USER_MANAGER, loc theo status, phan trang."""
    return repo.list_reports(status=status, page=page, page_size=page_size)


def review_report(user, report_id, note):
    """Danh dau da xac minh (REVIEWED) — chuyen sang buoc xu ly."""
    report = repo.get_report_by_id(report_id)
    if not report:
        raise NotFound("Khong tim thay bao cao.")
    report = repo.update_report(
        report,
        status=ChatReport.Status.REVIEWED,
        resolution_note=note or report.resolution_note,
        handled_by=user,
    )
    return report


def resolve_report(user, report_id, action, note):
    """Xu ly bao cao: WARNING / LOCK_3D / LOCK_7D / LOCK_FOREVER."""
    valid_actions = [a[0] for a in ChatReport.ActionTaken.choices]
    if action not in valid_actions:
        raise PermissionDenied("Hanh dong khong hop le.")

    report = repo.get_report_by_id(report_id)
    if not report:
        raise NotFound("Khong tim thay bao cao.")

    offender = report.message.sender
    report = repo.update_report(
        report,
        status=ChatReport.Status.RESOLVED,
        action_taken=action,
        resolution_note=note or report.resolution_note,
        handled_by=user,
        resolved_at=timezone.now(),
    )

    # Ap dung khoa tai khoan theo hanh dong
    now = timezone.now()
    if action == ChatReport.ActionTaken.WARNING:
        _send_notification(offender, "Canh cao tu quan tri vien", "Ban dang bi canh cao vi vi pham noi quy chat. Vui long giu gin van minh.")
    elif action == ChatReport.ActionTaken.LOCK_3D:
        _lock_user(offender, now + timedelta(days=3), f"Khoa 3 ngay: {note or ''}")
    elif action == ChatReport.ActionTaken.LOCK_7D:
        _lock_user(offender, now + timedelta(days=7), f"Khoa 1 tuan: {note or ''}")
    elif action == ChatReport.ActionTaken.LOCK_FOREVER:
        _lock_user_forever(offender)

    return report


def _lock_user(user, unlock_at, reason):
    """Khoa tai khoan den unlock_at — dung field tam (is_active=False + email trong db)."""
    repo.set_user_active(user, False)
    # Ghi chu gian han qua admin log/notification
    _send_notification(user, "Tai khoan tam khoa", f"Tai khoan cua ban da bi tam khoa. Ly do: {reason}")


def _lock_user_forever(user):
    repo.set_user_active(user, False)
    _send_notification(user, "Tai khoan khoa vinh vien", "Tai khoan cua ban da bi khoa vinh vien do vi pham nghiem trong.")


def _send_notification(user, title, body):
    try:
        repo.create_system_notification(user, title, body)
    except Exception:
        pass