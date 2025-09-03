from urllib.parse import parse_qs

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async


class NotificationsConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # Very simple token auth for dev: token is expected to be the numeric user ID
        # Example: ws://localhost:8000/ws/notifications/?token=123
        user = None
        try:
            query = parse_qs(self.scope.get("query_string", b"").decode())
            token = None
            if "token" in query and len(query["token"]) > 0:
                token = query["token"][0]
            # Also accept Authorization: Bearer <id>
            if not token:
                headers = dict((k.decode(), v.decode()) for k, v in self.scope.get("headers", []))
                auth = headers.get("authorization") or headers.get("Authorization")
                if auth and auth.lower().startswith("bearer "):
                    token = auth.split(" ", 1)[1].strip()

            if token and token.isdigit():
                User = get_user_model()
                user = await self._get_user(int(token))
        except Exception:
            user = None

        # Fallback to session auth if present
        if not user:
            scope_user = self.scope.get("user")
            if getattr(scope_user, "is_authenticated", False):
                user = scope_user

        if not user:
            await self.close(code=4401)  # unauthorized
            return

        self.user = user
        self.group_name = f"user_{user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        try:
            if hasattr(self, "group_name"):
                await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception:
            pass

    async def receive_json(self, content, **kwargs):
        # No-op; this is a server-push only channel.
        return

    async def notify(self, event):
        # Relay notifications pushed via channel layer
        payload = event.get("payload", {})
        await self.send_json(payload)

    @staticmethod
    @database_sync_to_async
    def _get_user(user_id: int):
        User = get_user_model()
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
