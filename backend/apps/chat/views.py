from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework import status

from apps.chat.services import chat_service
from apps.chat.serializers import (
    ChatRoomSerializer,
    ChatMessageSerializer,
    CreateTextMessageSerializer,
    ReportMessageSerializer,
)
from apps.common.response_helpers import success_response, error_response


class ChatRoomListAPIView(APIView):
    """GET /api/chat/rooms/ - Danh sách phòng chat của user (tab khóa còn hạn)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rooms = chat_service.get_rooms_for_user(request.user)
        return success_response(ChatRoomSerializer(rooms, many=True).data)


class ChatMessageListAPIView(APIView):
    """GET /api/chat/rooms/{room_id}/messages/ - Lịch sử tin nhắn (phân trang + kiểm tra quyền)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 50))
        try:
            data = chat_service.get_messages(request.user, room_id, page, page_size)
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_403_FORBIDDEN)
        return success_response({
            "items": ChatMessageSerializer(data["items"], many=True).data,
            "total": data["total"],
            "page": data["page"],
            "page_size": data["page_size"],
            "has_next": data["has_next"],
        })


class ChatMessageCreateAPIView(APIView):
    """POST /api/chat/rooms/{room_id}/messages/ - Gửi tin nhắn TEXT (lưu DB trước)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        serializer = CreateTextMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            message = chat_service.create_text_message(
                request.user, room_id, serializer.validated_data["content"]
            )
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)
        return success_response(
            ChatMessageSerializer(message).data,
            "Đã gửi tin nhắn.",
            status.HTTP_201_CREATED,
        )


class ChatMessageReportAPIView(APIView):
    """POST /api/chat/messages/{message_id}/report/ - Báo cáo vi phạm."""
    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        serializer = ReportMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            report = chat_service.report_message(
                request.user, message_id, serializer.validated_data["reason"]
            )
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)
        return success_response({"id": report.id}, "Đã gửi báo cáo vi phạm.", status.HTTP_201_CREATED)


class ChatVoiceSignatureAPIView(APIView):
    """
    POST /api/chat/rooms/{room_id}/voice/signature/ - Xin Cloudinary signed upload.
    Security: API Secret giữ ở Backend, không đưa lên Frontend (BR-3.12).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        try:
            from apps.chat.services import voice_service
            data = voice_service.get_voice_upload_signature()
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)
        return success_response(data, "Lấy chữ ký upload voice thành công.")


class ChatVoiceConfirmAPIView(APIView):
    """
    POST /api/chat/rooms/{room_id}/voice/confirm/ - Xác nhận asset → tạo ChatMessage VOICE.
    Body: { audio_url, duration, audio_format, replied_to_id? }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        audio_url = request.data.get("audio_url")
        duration = request.data.get("duration")
        audio_format = request.data.get("audio_format")
        if not audio_url:
            return error_response("Thiếu audio_url.", http_status=status.HTTP_400_BAD_REQUEST)
        try:
            message = chat_service.create_voice_message(
                request.user,
                room_id,
                audio_url,
                duration,
                audio_format,
                replied_to_id=request.data.get("replied_to_id"),
            )
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)
        return success_response(
            ChatMessageSerializer(message).data,
            "Đã gửi tin nhắn thoại.",
            status.HTTP_201_CREATED,
        )