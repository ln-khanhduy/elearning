"""ChatConsumer - WebSocket realtime chat theo khóa. Quyền đã có."""
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from apps.chat.models import ChatRoom


def _parse_qs(query_string):
    params = {}
    for part in query_string.decode().split("&"):
        if not part:
            continue
        k, _, v = part.partition("=")
        params[k] = v
    return params


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = None
        self.room = None
        self.group_name = None

        params = _parse_qs(self.scope.get("query_string", b""))
        token = params.get("token")
        course_id = params.get("course_id")

        if not token or not course_id:
            await self.close(code=4001)
            return

        user = await self.get_user_from_token(token)
        if user is None:
            await self.close(code=4001)
            return
        self.user = user

        # Kiem tra quyen da lop
        room = await self.get_room_for_course(course_id)
        if room is None or not await self.check_access(user, room):
            await self.close(code=4003)  # het han/khong quyen
            return

        self.room = room
        self.group_name = f"chat_{room.course_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Broadcast trang thái online/offline (reconnect + broadcast)
        online = await self.mark_online(user.id)
        await self.broadcast_presence(str(user.id), online)

    async def disconnect(self, close_code):
        if hasattr(self, "group_name") and self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        if self.user and hasattr(self, "group_name") and self.group_name:
            online = await self.mark_offline(self.user.id)
            await self.broadcast_presence(str(self.user.id), online)

    async def user_presence(self, event):
        await self.send_json(event["data"])

    async def receive_json(self, content):
        if content.get("type") == "ping":
            await self.send_json({"type": "pong"})
            return
        if content.get("type") == "send_message":
            await self.handle_send(content)

    async def handle_send(self, content):
        text = (content.get("content") or "").strip()
        if not text:
            await self.send_json({"type": "error", "message": "Nội dung không được để trống."})
            return
        if len(text) > 1000:
            await self.send_json({"type": "error", "message": "Tin nhắn tối đa 1000 ký tự."})
            return

        if not await self.check_access(self.user, self.room):
            await self.send_json({"type": "error", "message": "Khóa học đã hết hạn. Không thể gửi tin nhắn."})
            return

        message = await self.save_text_message(self.user, self.room, text)
        if message is None:
            await self.send_json({"type": "error", "message": "Không thể lưu tin nhắn."})
            return

        await self.channel_layer.group_send(
            self.group_name,
            {"type": "chat_message", "data": self.build_payload(message)},
        )

    async def chat_message(self, event):
        await self.send_json(event["data"])

    def build_payload(self, message):
        s = message.sender
        return {
            "type": "new_message",
            "message": {
                "id": str(message.id),
                "room": str(message.room_id),
                "sender_id": str(s.id),
                "sender_name": s.get_full_name() or s.email,
                "sender_avatar": getattr(s, "avatar_url", None),
                "message_type": message.message_type,
                "content": message.content,
                "audio_url": message.audio_url,
                "audio_duration": message.audio_duration,
                "audio_format": message.audio_format,
                "replied_to": str(message.replied_to_id) if message.replied_to_id else None,
                "sent_at": message.sent_at.isoformat() if message.sent_at else None,
            },
        }

    @database_sync_to_async
    def get_user_from_token(self, token):
        User = get_user_model()
        try:
            t = AccessToken(token)
            return User.objects.filter(id=t["user_id"]).first()
        except (InvalidToken, TokenError, KeyError):
            return None

    @database_sync_to_async
    def get_room_for_course(self, course_id):
        return ChatRoom.objects.select_related("course").filter(course_id=course_id).first()

    @database_sync_to_async
    def check_access(self, user, room):
        from apps.chat.services.chat_service import user_can_access_chat
        return user_can_access_chat(user, room.course)

    @database_sync_to_async
    def save_text_message(self, user, room, text):
        from apps.chat.models import ChatMessage
        return ChatMessage.objects.create(
            room=room, sender=user, message_type=ChatMessage.MessageType.TEXT, content=text
        )

    @database_sync_to_async
    def mark_online(self, user_id):
        """Đánh dấu online + trả số kết nối hiện tại."""
        from django.core.cache import cache
        key = f"chat_online_{user_id}"
        count = cache.get(key, 0) + 1
        cache.set(key, count, 300) 
        return True

    @database_sync_to_async
    def mark_offline(self, user_id):
        """Giảm số kết nối; trả False nếu không còn kết nối."""
        from django.core.cache import cache
        key = f"chat_online_{user_id}"
        count = cache.get(key, 1) - 1
        if count <= 0:
            cache.delete(key)
            return False
        cache.set(key, count, 300)
        return True

    async def broadcast_presence(self, user_id, online):
        """Broadcast trạng thái online/offline đến group của phòng"""
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "user_presence",
                "data": {"type": "user_presence", "user_id": user_id, "online": online},
            },
        )