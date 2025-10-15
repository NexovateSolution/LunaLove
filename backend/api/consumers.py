import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()
logger = logging.getLogger(__name__)

class MatchNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get user from token
        self.user = await self.get_user_from_token()
        if not self.user:
            await self.close()
            return

        # Join user-specific group
        self.user_group_name = f"user_{self.user.id}"
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )

        await self.accept()
        logger.info(f"WebSocket connected for user {self.user.id}")

    async def disconnect(self, close_code):
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
        logger.info(f"WebSocket disconnected with code {close_code}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")

    # Handle match notification
    async def match_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'match_notification',
            'match': event['match'],
            'message': event['message']
        }))

    # Handle new message notification
    async def message_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message_notification',
            'match_id': event['match_id'],
            'message': event['message'],
            'sender': event['sender']
        }))

    # Handle like notification (for subscribers)
    async def like_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'like_notification',
            'liker': event['liker'],
            'message': event['message']
        }))

    @database_sync_to_async
    def get_user_from_token(self):
        try:
            # Get token from query string
            token_key = self.scope['query_string'].decode().split('token=')[1].split('&')[0]
            token = Token.objects.get(key=token_key)
            return token.user
        except (IndexError, Token.DoesNotExist):
            return None


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.match_id = self.scope['url_route']['kwargs']['match_id']
        self.user = await self.get_user_from_token()
        
        if not self.user:
            await self.close()
            return

        # Verify user is part of this match
        if not await self.user_in_match():
            await self.close()
            return

        self.room_group_name = f"chat_{self.match_id}"

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        logger.info(f"Chat WebSocket connected for user {self.user.id} in match {self.match_id}")

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'chat_message':
                content = data.get('content', '').strip()
                if content:
                    # Save message to database
                    message = await self.save_message(content)
                    
                    # Send message to room group
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_message',
                            'message': {
                                'id': str(message.id),
                                'content': message.content,
                                'sender_id': str(message.sender.id),
                                'sender_name': message.sender.first_name,
                                'sent_at': message.sent_at.isoformat(),
                            }
                        }
                    )
            elif message_type == 'typing':
                # Broadcast typing indicator
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'typing_indicator',
                        'user_id': str(self.user.id),
                        'is_typing': data.get('is_typing', False)
                    }
                )
        except json.JSONDecodeError:
            logger.error("Invalid JSON received in chat")

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message
        }))

    # Receive typing indicator from room group
    async def typing_indicator(self, event):
        # Don't send typing indicator back to the sender
        if event['user_id'] != str(self.user.id):
            await self.send(text_data=json.dumps({
                'type': 'typing_indicator',
                'user_id': event['user_id'],
                'is_typing': event['is_typing']
            }))

    @database_sync_to_async
    def get_user_from_token(self):
        try:
            token_key = self.scope['query_string'].decode().split('token=')[1].split('&')[0]
            token = Token.objects.get(key=token_key)
            return token.user
        except (IndexError, Token.DoesNotExist):
            return None

    @database_sync_to_async
    def user_in_match(self):
        from .models import Match
        try:
            match = Match.objects.get(id=self.match_id, is_active=True)
            return self.user in [match.user1, match.user2]
        except Match.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content):
        from .models import Match, Message
        from django.utils import timezone
        
        match = Match.objects.get(id=self.match_id, is_active=True)
        message = Message.objects.create(
            match=match,
            sender=self.user,
            content=content
        )
        
        # Update match last interaction
        match.last_interaction_at = timezone.now()
        match.save(update_fields=['last_interaction_at'])
        
        return message
