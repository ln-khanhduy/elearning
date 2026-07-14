from django.urls import path
from apps.notifications.views import (
    NotificationListAPIView,
    NotificationUnreadCountAPIView,
    NotificationMarkReadAPIView,
    NotificationMarkAllReadAPIView,
    NotificationDeleteAllAPIView,
)

urlpatterns = [
    path("", NotificationListAPIView.as_view(), name="notification-list"),
    path("unread-count/", NotificationUnreadCountAPIView.as_view(), name="notification-unread-count"),
    path("<int:notification_id>/read/", NotificationMarkReadAPIView.as_view(), name="notification-mark-read"),
    path("read-all/", NotificationMarkAllReadAPIView.as_view(), name="notification-mark-all-read"),
    path("delete-all/", NotificationDeleteAllAPIView.as_view(), name="notification-delete-all"),
]
