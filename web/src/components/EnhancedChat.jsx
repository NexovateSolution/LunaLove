import React, { useState, useEffect, useRef } from 'react';
import { 
  FiSend, FiArrowLeft, FiMoreVertical, FiHeart, FiGift,
  FiImage, FiSmile, FiPhone, FiVideo
} from 'react-icons/fi';
import { getMatchMessages, sendMatchMessage } from '../api';

const EnhancedChat = ({ match, onBack, onGift, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (match?.id) {
      loadMessages();
    }
  }, [match?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!match?.id) return;
    
    try {
      setLoading(true);
      const response = await getMatchMessages(match.id);
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !match?.id) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const response = await sendMatchMessage(match.id, messageText);
      
      // Add the new message to the local state
      const newMsg = {
        id: response.id,
        content: messageText,
        sender_id: currentUser?.id,
        sender_name: currentUser?.first_name || 'You',
        sent_at: response.sent_at,
        read_at: null
      };
      
      setMessages(prev => [...prev, newMsg]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the message if sending failed
      setNewMessage(messageText);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderMessage = (message, index) => {
    const isMe = message.sender_id === currentUser?.id;
    const showAvatar = !isMe && (index === 0 || messages[index - 1]?.sender_id !== message.sender_id);
    const showTime = index === messages.length - 1 || 
                    messages[index + 1]?.sender_id !== message.sender_id ||
                    new Date(messages[index + 1]?.sent_at) - new Date(message.sent_at) > 300000; // 5 minutes

    return (
      <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
        <div className={`flex items-end gap-2 max-w-xs lg:max-w-md ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          {showAvatar && !isMe && (
            <img
              src={match.other_user?.photos?.[0]?.photo || '/avatar.png'}
              alt={match.other_user?.first_name}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          {!showAvatar && !isMe && <div className="w-8" />}

          {/* Message bubble */}
          <div className={`px-4 py-2 rounded-2xl ${
            isMe 
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-br-md'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-md'
          }`}>
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
        </div>
        
        {/* Timestamp */}
        {showTime && (
          <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
            isMe ? 'text-right mr-2' : 'text-left ml-10'
          }`}>
            {formatTime(message.sent_at)}
          </div>
        )}
      </div>
    );
  };

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No match selected</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <FiArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            
            <img
              src={match.other_user?.photos?.[0]?.photo || '/avatar.png'}
              alt={match.other_user?.first_name}
              className="w-10 h-10 rounded-full object-cover"
            />
            
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {match.other_user?.first_name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Matched {formatTime(match.matched_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onGift && onGift()}
              className="p-2 hover:bg-pink-100 dark:hover:bg-pink-900/20 rounded-full transition-colors"
              title="Send gift"
            >
              <FiGift className="text-pink-500" size={20} />
            </button>
            
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              <FiPhone className="text-gray-600 dark:text-gray-400" size={20} />
            </button>
            
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              <FiVideo className="text-gray-600 dark:text-gray-400" size={20} />
            </button>
            
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              <FiMoreVertical className="text-gray-600 dark:text-gray-400" size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiHeart className="text-white text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              You matched with {match.other_user?.first_name}!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start the conversation and get to know each other better.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => inputRef.current?.focus()}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-2 rounded-full font-semibold transition-all duration-200"
              >
                Say Hello 👋
              </button>
              <button
                onClick={() => onGift && onGift()}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-full font-semibold transition-all duration-200"
              >
                Send Gift 🎁
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message, index) => renderMessage(message, index))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-4 py-4">
        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${match.other_user?.first_name}...`}
              className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows="1"
              style={{ minHeight: '48px', maxHeight: '120px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            
            <div className="absolute right-3 bottom-3 flex items-center gap-1">
              <button
                type="button"
                className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full transition-colors"
              >
                <FiSmile className="text-gray-500 dark:text-gray-400" size={16} />
              </button>
              <button
                type="button"
                className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full transition-colors"
              >
                <FiImage className="text-gray-500 dark:text-gray-400" size={16} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`p-3 rounded-full transition-all duration-200 ${
              newMessage.trim() && !sending
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            <FiSend size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default EnhancedChat;
