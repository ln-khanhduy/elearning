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
        unread_count = await self.get_unread_count(user.id)
        await self.send_json({
            "type": "unread_count",
            "count": unread_count,
        })

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content):
        # Client can request unread count manually
        msg_type = content.get("type")
        if msg_type == "ping":
            await self.send_json({"type": "pong"})

    async def notification_message(self, event):
        """Called when a notification is sent to the group."""
        await self.send_json(event["data"])

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
    def get_unread_count(self, user_id):
        from apps.notifications.models import Notification
        return Notification.objects.filter(recipient_id=user_id, is_read=False).count()