import React, { useState, useEffect, useRef } from 'react';
import { 
  FiSend, FiX, FiMoreVertical, FiPhone, FiVideo, FiImage, FiSmile 
} from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';

const ChatWindow = ({ match, onClose, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const messagesEndRef = useRef(null);
  const ws = useRef(null);

  // Get the other user's info
  const otherUser = match?.liker?.id === currentUser?.id ? match?.liked : match?.liker;

  useEffect(() => {
    // Initialize WebSocket connection for real-time chat
    const initializeChat = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/chat/${match?.id}/`;
      
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => {
        console.log('Chat WebSocket connected');
        setIsOnline(true);
      };
      
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chat_message') {
          setMessages(prev => [...prev, {
            id: data.message_id,
            content: data.message,
            sender: data.sender,
            timestamp: data.timestamp,
            is_read: false
          }]);
        } else if (data.type === 'typing_indicator') {
          setIsTyping(data.is_typing && data.sender !== currentUser?.id);
        } else if (data.type === 'user_status') {
          setIsOnline(data.is_online);
        }
      };
      
      ws.current.onclose = () => {
        console.log('Chat WebSocket disconnected');
        setIsOnline(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(initializeChat, 3000);
      };
      
      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    if (match?.id) {
      initializeChat();
      loadChatHistory();
    }

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [match?.id, currentUser?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat/${match.id}/messages/`, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.results || []);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !ws.current) return;

    const messageData = {
      type: 'chat_message',
      message: newMessage.trim(),
      match_id: match.id
    };

    ws.current.send(JSON.stringify(messageData));
    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendTypingIndicator = (isTyping) => {
    if (ws.current) {
      ws.current.send(JSON.stringify({
        type: 'typing_indicator',
        is_typing: isTyping,
        match_id: match.id
      }));
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getProfileImage = (user) => {
    if (user?.user_photos && user.user_photos.length > 0) {
      return user.user_photos[0].photo;
    }
    return '/avatar.png';
  };

  if (!match || !otherUser) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col">
      <div className="bg-white dark:bg-slate-800 w-full h-full flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-purple-500 to-pink-600">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={getProfileImage(otherUser)}
                alt={otherUser.first_name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white"
                onError={(e) => {
                  e.target.src = '/avatar.png';
                }}
              />
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white">
                {otherUser.first_name || otherUser.username}
              </h3>
              <p className="text-sm text-white/80">
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors">
              <FiPhone size={20} />
            </button>
            <button className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors">
              <FiVideo size={20} />
            </button>
            <button className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors">
              <FiMoreVertical size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Match Notification */}
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full text-pink-700 dark:text-pink-300 text-sm font-medium">
              <FaHeart className="text-pink-500" />
              <span>You matched with {otherUser.first_name}!</span>
            </div>
          </div>

          {/* Messages */}
          {messages.map((message, index) => {
            const isCurrentUser = message.sender === currentUser?.id;
            const showDate = index === 0 || 
              formatDate(messages[index - 1]?.timestamp) !== formatDate(message.timestamp);

            return (
              <div key={message.id || index}>
                {/* Date Separator */}
                {showDate && (
                  <div className="text-center py-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                      {formatDate(message.timestamp)}
                    </span>
                  </div>
                )}

                {/* Message */}
                <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    isCurrentUser
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isCurrentUser 
                        ? 'text-white/70' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-slate-700 px-4 py-2 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-purple-500 transition-colors">
              <FiImage size={20} />
            </button>
            <button className="p-2 text-gray-400 hover:text-purple-500 transition-colors">
              <FiSmile size={20} />
            </button>
            
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  sendTypingIndicator(e.target.value.length > 0);
                }}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="w-full px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 max-h-20"
                rows="1"
                style={{ minHeight: '40px' }}
              />
            </div>
            
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <FiSend size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
