import React, { useState, useEffect } from 'react';
import { FiX, FiHeart, FiMessageCircle, FiUsers } from 'react-icons/fi';
import useWebSocket from '../hooks/useWebSocket';

const NotificationSystem = ({ authToken, onMatchNotification, onMessageNotification }) => {
  const [notifications, setNotifications] = useState([]);
  
  const wsUrl = `ws://localhost:8000/ws/notifications/`;
  
  const handleWebSocketMessage = (data) => {
    console.log('WebSocket message received:', data);
    
    switch (data.type) {
      case 'match_notification':
        addNotification({
          id: Date.now(),
          type: 'match',
          title: 'New Match! 💕',
          message: `You matched with ${data.match.other_user?.first_name}!`,
          data: data.match,
          timestamp: new Date()
        });
        if (onMatchNotification) onMatchNotification(data.match);
        break;
        
      case 'message_notification':
        addNotification({
          id: Date.now(),
          type: 'message',
          title: 'New Message 💬',
          message: `${data.sender.name} sent you a message`,
          data: data,
          timestamp: new Date()
        });
        if (onMessageNotification) onMessageNotification(data);
        break;
        
      case 'like_notification':
        addNotification({
          id: Date.now(),
          type: 'like',
          title: 'Someone Liked You! ❤️',
          message: 'Check your matches to see who!',
          data: data.liker,
          timestamp: new Date()
        });
        break;
        
      default:
        console.log('Unknown notification type:', data.type);
    }
  };

  const { isConnected, error } = useWebSocket(wsUrl, authToken, handleWebSocketMessage);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'match':
        return <FiUsers className="text-pink-500" />;
      case 'message':
        return <FiMessageCircle className="text-blue-500" />;
      case 'like':
        return <FiHeart className="text-red-500" />;
      default:
        return <FiHeart className="text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'match':
        return 'from-pink-500 to-purple-600';
      case 'message':
        return 'from-blue-500 to-indigo-600';
      case 'like':
        return 'from-red-500 to-pink-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <>
      {/* Connection Status (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 left-4 z-50">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isConnected 
              ? 'bg-green-100 text-green-800' 
              : error 
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
          }`}>
            {isConnected ? '🟢 Connected' : error ? '🔴 Error' : '🟡 Connecting...'}
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden transform transition-all duration-300 animate-slide-in`}
          >
            {/* Gradient header */}
            <div className={`h-1 bg-gradient-to-r ${getNotificationColor(notification.type)}`} />
            
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {notification.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <FiX size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom styles for animation */}
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default NotificationSystem;
