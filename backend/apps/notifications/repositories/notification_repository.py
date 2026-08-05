from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from apps.notifications.models import Notification


def create(recipient, title, body, notification_type, channel, link=None):
    """Tạo mới một thông báo và gửi realtime qua WebSocket cho người nhận."""
    notification = Notification.objects.create(
        recipient=recipient,
        title=title,
        body=body,
        notification_type=notification_type,
        channel=channel,
        link=link,
        is_read=False,
        send_status="SENT",
    )
    _broadcast_notification(notification)
    return notification


def _broadcast_notification(notification):
    """Gửi notification realtime qua WebSocket đến user."""
    try:
        channel_layer = get_channel_layer()
        group_name = f"notifications_{notification.recipient_id}"
        unread_count = Notification.objects.filter(
            recipient_id=notification.recipient_id, is_read=False
        ).count()
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "notification_message",
                "data": {
                    "type": "new_notification",
                    "notification": {
                        "id": notification.id,
                        "title": notification.title,
                        "body": notification.body,
                        "notification_type": notification.notification_type,
                        "channel": notification.channel,
                        "link": notification.link,
                        "is_read": notification.is_read,
                        "created_at": notification.created_at.isoformat(),
                    },
                    "unread_count": unread_count,
                },
            },
        )
    except Exception:
        pass  # Fail silently if WebSocket broadcast fails


def get_by_user(user_id, page=1, page_size=20):
    """Lấy danh sách thông báo của một người dùng, hỗ trợ phân trang.

    Trả về dict chứa: items, total, page, page_size, total_pages, has_next, has_previous.
    """
    from django.core.paginator import Paginator
    from apps.notifications.serializers.notification_serializer import NotificationSerializer
    qs = Notification.objects.filter(recipient_id=user_id).order_by("-created_at")
    paginator = Paginator(qs, page_size)
    items = paginator.get_page(page)
    serializer = NotificationSerializer(items, many=True)
    return {
        "items": serializer.data,
        "total": paginator.count,
        "page": page,
        "page_size": page_size,
        "total_pages": paginator.num_pages,
        "has_next": items.has_next(),
        "has_previous": items.has_previous(),
    }


def get_unread_count(user_id):
    """Đếm số thông báo chưa đọc của một người dùng."""
    return Notification.objects.filter(recipient_id=user_id, is_read=False).count()


def mark_as_read(notification_id, user_id):
    """Đánh dấu một thông báo là đã đọc (chỉ thông báo thuộc về user)."""
    return Notification.objects.filter(id=notification_id, recipient_id=user_id).update(is_read=True)


def mark_all_as_read(user_id):
    """Đánh dấu tất cả thông báo chưa đọc của một người dùng là đã đọc."""
    return Notification.objects.filter(recipient_id=user_id, is_read=False).update(is_read=True)


def delete_all(user_id):
    """Xóa toàn bộ thông báo của một người dùng."""
    return Notification.objects.filter(recipient_id=user_id).delete()


def get_recent(user_id, limit=5):
    """Lấy danh sách thông báo gần nhất của một người dùng (mặc định 5 bản ghi)."""
    return Notification.objects.filter(recipient_id=user_id).order_by("-created_at")[:limit]