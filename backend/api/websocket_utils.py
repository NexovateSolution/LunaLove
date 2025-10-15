from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)
channel_layer = get_channel_layer()

def send_match_notification(user_id, match_data):
    """Send a match notification to a specific user"""
    if not channel_layer:
        logger.warning("Channel layer not configured - WebSocket notifications disabled")
        return
    
    try:
        async_to_sync(channel_layer.group_send)(
            f"user_{user_id}",
            {
                'type': 'match_notification',
                'match': match_data,
                'message': f"You have a new match!"
            }
        )
        logger.info(f"Match notification sent to user {user_id}")
    except Exception as e:
        logger.error(f"Failed to send match notification: {e}")

def send_message_notification(user_id, match_id, message_data, sender_data):
    """Send a message notification to a specific user"""
    if not channel_layer:
        logger.warning("Channel layer not configured - WebSocket notifications disabled")
        return
    
    try:
        async_to_sync(channel_layer.group_send)(
            f"user_{user_id}",
            {
                'type': 'message_notification',
                'match_id': str(match_id),
                'message': message_data,
                'sender': sender_data
            }
        )
        logger.info(f"Message notification sent to user {user_id}")
    except Exception as e:
        logger.error(f"Failed to send message notification: {e}")

def send_like_notification(user_id, liker_data):
    """Send a like notification to subscribers only"""
    if not channel_layer:
        logger.warning("Channel layer not configured - WebSocket notifications disabled")
        return
    
    try:
        async_to_sync(channel_layer.group_send)(
            f"user_{user_id}",
            {
                'type': 'like_notification',
                'liker': liker_data,
                'message': f"Someone liked you!"
            }
        )
        logger.info(f"Like notification sent to user {user_id}")
    except Exception as e:
        logger.error(f"Failed to send like notification: {e}")
