from django.urls import path
from apps.notifications.views import (
    NotificationListAPIView,
    NotificationUnreadCountAPIView,
    NotificationMarkReadAPIView,
    NotificationMarkAllReadAPIView,
)

urlpatterns = [
    path("", NotificationListAPIView.as_view(), name="notification-list"),
    path("unread-count/", NotificationUnreadCountAPIView.as_view(), name="notification-unread-count"),
    path("<int:notification_id>/read/", NotificationMarkReadAPIView.as_view(), name="notification-mark-read"),
    path("read-all/", NotificationMarkAllReadAPIView.as_view(), name="notification-mark-all-read"),
]