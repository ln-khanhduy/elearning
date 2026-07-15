import json
from decimal import Decimal
from datetime import datetime
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = None
        query_string = self.scope.get("query_string", b"").decode()
        params = dict(param.split("=") for param in query_string.split("&") if param)
        token = params.get("token")

        if not token:
            await self.close(code=4001)
            return

        user = await self.get_user_from_token(token)
        if user is None:
            await self.close(code=4001)
            return

        self.user = user
        self.group_name = f"notifications_{user.id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Send unread count immediately on connect
        unread_count = await self.get_unread_count_for_user(user.id)
        await self.send_json({
            "type": "unread_count",
            "count": unread_count,
        })

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content):
        msg_type = content.get("type")
        request_id = content.get("request_id")

        handlers = {
            "ping": self._handle_ping,
            "list_notifications": self._handle_list,
            "get_unread_count": self._handle_unread_count,
            "mark_read": self._handle_mark_read,
            "mark_all_read": self._handle_mark_all_read,
            "delete_all": self._handle_delete_all,
        }

        handler = handlers.get(msg_type)
        if handler:
            await handler(content, request_id)

    async def _send_response(self, request_id, response_data):
        """Send a response with the matching request_id."""
        response_data["request_id"] = request_id
        await self.send_json(response_data)

    async def _handle_ping(self, content, request_id):
        await self._send_response(request_id, {"type": "pong"})

    async def _handle_list(self, content, request_id):
        page = int(content.get("page", 1))
        page_size = int(content.get("page_size", 20))
        data = await self.get_notifications(self.user.id, page, page_size)
        await self._send_response(request_id, {
            "type": "list_notifications",
            **data,
        })

    async def _handle_unread_count(self, content, request_id):
        count = await self.get_unread_count_for_user(self.user.id)
        await self._send_response(request_id, {
            "type": "unread_count",
            "count": count,
        })

    async def _handle_mark_read(self, content, request_id):
        notification_id = content.get("notification_id")
        if notification_id:
            await self.mark_as_read(notification_id, self.user.id)
        count = await self.get_unread_count_for_user(self.user.id)
        await self._send_response(request_id, {
            "type": "mark_read",
            "notification_id": notification_id,
            "unread_count": count,
        })

    async def _handle_mark_all_read(self, content, request_id):
        await self.mark_all_as_read(self.user.id)
        await self._send_response(request_id, {
            "type": "mark_all_read",
            "unread_count": 0,
        })

    async def _handle_delete_all(self, content, request_id):
        await self.delete_all(self.user.id)
        await self._send_response(request_id, {
            "type": "delete_all",
        })

    async def notification_message(self, event):
        """Called when a notification is sent to the group."""
        await self.send_json(event["data"])

    # --- Synchronous DB helpers ---

    @database_sync_to_async
    def get_user_from_token(self, token):
        User = get_user_model()
        try:
            access_token = AccessToken(token)
            user_id = access_token["user_id"]
            return User.objects.filter(id=user_id).first()
        except (InvalidToken, TokenError, KeyError):
            return None

    @database_sync_to_async
    def get_unread_count_for_user(self, user_id):
        from apps.notifications.models import Notification
        return Notification.objects.filter(recipient_id=user_id, is_read=False).count()

    @database_sync_to_async
    def get_notifications(self, user_id, page=1, page_size=20):
        from django.core.paginator import Paginator
        from apps.notifications.serializers.notification_serializer import NotificationSerializer
        from apps.notifications.models import Notification

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

    @database_sync_to_async
    def mark_as_read(self, notification_id, user_id):
        from apps.notifications.models import Notification
        Notification.objects.filter(id=notification_id, recipient_id=user_id).update(is_read=True)

    @database_sync_to_async
    def mark_all_as_read(self, user_id):
        from apps.notifications.models import Notification
        Notification.objects.filter(recipient_id=user_id, is_read=False).update(is_read=True)

    @database_sync_to_async
    def delete_all(self, user_id):
        from apps.notifications.models import Notification
        Notification.objects.filter(recipient_id=user_id).delete()