from django.urls import path
from apps.chat.views import (
    ChatRoomListAPIView,
    ChatMessageListAPIView,
    ChatMessageCreateAPIView,
    ChatMessageReportAPIView,
    ChatVoiceSignatureAPIView,
    ChatVoiceConfirmAPIView,
)
from apps.chat.views_admin import (
    ChatReportListAPIView,
    ChatReportReviewAPIView,
    ChatReportResolveAPIView,
)

urlpatterns = [
    path("rooms/", ChatRoomListAPIView.as_view(), name="chat-rooms"),
    path("rooms/<uuid:room_id>/messages/", ChatMessageListAPIView.as_view(), name="chat-messages"),
    path("rooms/<uuid:room_id>/messages/send/", ChatMessageCreateAPIView.as_view(), name="chat-send"),
    path("rooms/<uuid:room_id>/voice/signature/", ChatVoiceSignatureAPIView.as_view(), name="chat-voice-signature"),
    path("rooms/<uuid:room_id>/voice/confirm/", ChatVoiceConfirmAPIView.as_view(), name="chat-voice-confirm"),
    path("messages/<uuid:message_id>/report/", ChatMessageReportAPIView.as_view(), name="chat-report"),
    # Admin - Báo cáo vi phạm chat (USER_MANAGER)
    path("admin/reports/", ChatReportListAPIView.as_view(), name="chat-admin-reports"),
    path("admin/reports/<uuid:report_id>/review/", ChatReportReviewAPIView.as_view(), name="chat-admin-report-review"),
    path("admin/reports/<uuid:report_id>/resolve/", ChatReportResolveAPIView.as_view(), name="chat-admin-report-resolve"),
]
