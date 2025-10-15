import React, { useRef, useEffect, useState } from "react";
import { FaGift } from "react-icons/fa";
import { FiArrowLeft, FiSend, FiMoreVertical, FiImage, FiSmile, FiX } from "react-icons/fi";
import GiftEffects from "./GiftEffects";
import { getMatchMessages } from "../api";


export default function Chat({ match, onBack, onGift, onSendMessage, effects = [], onEffectDone }) {

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const messagesEndRef = useRef(null);

  // Fetch current user
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Set up WebSocket connection when match changes
  useEffect(() => {
    if (match?.id && currentUser) {
      // Initial message fetch
      fetchMessages();
      
      // Set up WebSocket connection
      connectWebSocket();
      
      return () => {
        if (socket) {
          socket.close();
        }
      };
    }
  }, [match?.id, currentUser]);

  const connectWebSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Use ws:// for development, wss:// for production
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//localhost:8000/ws/chat/${match.id}/?token=${token}`;
    
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };
    
    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chat_message') {
        // Add new message to the list
        setMessages(prev => [...prev, data.message]);
      }
    };
    
    newSocket.onclose = () => {
      console.log('WebSocket disconnected, falling back to polling');
      setIsConnected(false);
      
      // Fall back to polling if WebSocket fails
      startPolling();
    };
    
    newSocket.onerror = (error) => {
      console.error('WebSocket error, falling back to polling:', error);
      setIsConnected(false);
      startPolling();
    };
    
    setSocket(newSocket);
  };

  const startPolling = () => {
    console.log('Starting message polling as fallback');
    const interval = setInterval(() => {
      if (match?.id && !loading) {
        fetchMessages();
      }
    }, 5000); // Poll every 5 seconds (reduced frequency)
    
    // Store interval reference for cleanup
    return () => clearInterval(interval);
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/user/me/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  // Scroll to bottom when new messages arrive (but not on initial load)
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0 && !loading) {
      // Only scroll on new messages, not initial load
      const timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, loading]);

  const fetchMessages = async () => {
    if (!match?.id) return;
    
    // Rate limiting: don't fetch more than once every 3 seconds
    const now = Date.now();
    if (now - lastFetchTime < 3000) {
      return;
    }
    setLastFetchTime(now);
    
    try {
      const response = await getMatchMessages(match.id);
      setMessages(response || []);
    } catch (error) {
      if (error.response?.status === 429) {
        console.warn('Rate limited - slowing down requests');
        // If rate limited, wait longer before next request
        setLastFetchTime(now + 10000); // Wait extra 10 seconds
      } else {
        console.error('Error fetching messages:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!match) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No match selected.
      </div>
    );
  }

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const messageText = input;
    setInput("");
    
    // Try WebSocket first if connected
    if (socket && isConnected) {
      try {
        socket.send(JSON.stringify({
          type: 'chat_message',
          message: messageText
        }));
      } catch (error) {
        console.error('WebSocket send failed:', error);
      }
    }
    
    // Always send via HTTP API (primary method)
    try {
      await onSendMessage(messageText);
      // Refresh messages after sending if not using WebSocket
      if (!isConnected) {
        setTimeout(fetchMessages, 500);
      }
    } catch (error) {
      console.error('Failed to send message via API:', error);
    }
  };

  // Get the other user's info for display
  let otherUser = null;
  if (match) {
    // Simple approach: if we have both liker and liked, pick one that's not the current user
    if (match.liker && match.liked && currentUser) {
      // Try exact ID comparison first
      if (match.liker.id === currentUser.id) {
        otherUser = match.liked;
      } else if (match.liked.id === currentUser.id) {
        otherUser = match.liker;
      } else {
        // If no exact match, try string comparison
        if (String(match.liker.id) === String(currentUser.id)) {
          otherUser = match.liked;
        } else if (String(match.liked.id) === String(currentUser.id)) {
          otherUser = match.liker;
        } else {
          // Fallback: just pick the liker if we can't determine
          otherUser = match.liker;
        }
      }
    } else {
      // If we don't have current user yet, just pick the liker as fallback
      otherUser = match.liker || match.liked;
    }
  }
  
  // Extract user name with multiple fallbacks
  const otherUserName = otherUser?.first_name || 
                       otherUser?.name || 
                       otherUser?.username ||
                       match?.name || 
                       'Chat Partner';
  
  // Debug the user data structure (temporary)
  if (process.env.NODE_ENV === 'development') {
    console.log('Debug - Other User:', otherUser);
    console.log('Debug - Other User Name:', otherUserName);
  }
                       
  // Extract user avatar with multiple fallbacks  
  const otherUserAvatar = otherUser?.photos?.[0]?.photo || 
                         otherUser?.user_photos?.[0]?.photo || 
                         otherUser?.profile_picture ||
                         match?.avatar || 
                         '/avatar.png';

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-4 shadow-lg flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <FiArrowLeft size={20} className="text-white" />
            </button>
            <button 
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-3 hover:bg-white/10 rounded-lg p-2 -m-2 transition-colors"
            >
              <div className="relative">
                <img 
                  src={otherUserAvatar} 
                  alt={otherUserName} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                  onError={(e) => {
                    e.target.src = '/avatar.png';
                  }}
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-white text-lg">{otherUserName}</h2>
                <p className="text-sm font-medium flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className={isConnected ? 'text-green-200' : 'text-gray-300'}>
                    {isConnected ? 'Online' : 'Connecting...'}
                  </span>
                </p>
              </div>
            </button>
          </div>
          
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <FiMoreVertical size={18} className="text-white/80" />
            </button>
          </div>
        </div>
      </div>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 min-h-0">
        {/* Gift Effects Overlay */}
        <GiftEffects effects={effects} onDone={onEffectDone} />

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg, i) => {
            const isFromMe = currentUser && msg.sender_id === currentUser.id;
            return (
              <div
                key={msg.id || i}
                className={`flex ${isFromMe ? "justify-end" : "justify-start"} mb-4`}
              >
                <div className={`flex items-end gap-3 max-w-[85%] ${isFromMe ? "flex-row-reverse" : "flex-row"}`}>
                  {!isFromMe && (
                    <img 
                      src={otherUserAvatar} 
                      alt={otherUserName} 
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 border-2 border-purple-500/20"
                      onError={(e) => {
                        e.target.src = '/avatar.png';
                      }}
                    />
                  )}
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm ${
                      isFromMe
                        ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-br-sm"
                        : "bg-slate-700/80 text-white border border-slate-600/50 rounded-bl-sm"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    {msg.sent_at && (
                      <span className={`block text-xs mt-2 opacity-70 ${
                        isFromMe ? "text-purple-100" : "text-slate-300"
                      }`}>
                        {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Start the conversation!</h3>
            <p className="text-slate-300 max-w-sm leading-relaxed">
              Say hello to {otherUserName} and break the ice. You matched for a reason! ✨
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Enhanced Input Area */}
      <div className="bg-slate-800/90 backdrop-blur-sm border-t border-slate-700/50 px-4 py-4 flex-shrink-0">
        <div className="flex items-end gap-3">
          {/* Attachment Button */}
          <button className="p-3 text-slate-400 hover:text-purple-400 hover:bg-slate-700/50 rounded-full transition-colors">
            <FiImage size={20} />
          </button>
          
          {/* Message Input */}
          <div className="flex-1 relative">
            <input
              className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-slate-400 transition-all backdrop-blur-sm"
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
            />
            <button 
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-purple-600 transition-colors"
            >
              <FiSmile size={18} />
            </button>
          </div>
          
          {/* Gift Button */}
          <button
            className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-full transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            title="Send Gift"
            onClick={onGift}
          >
            <FaGift size={16} />
          </button>
          
          {/* Send Button */}
          <button
            className={`p-3 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl ${
              input.trim() 
                ? "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white" 
                : "bg-slate-600/50 text-slate-500 cursor-not-allowed"
            }`}
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <FiSend size={16} />
          </button>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowProfile(false)}>
          <div className="bg-slate-800 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Profile Header */}
            <div className="relative">
              <img 
                src={otherUserAvatar} 
                alt={otherUserName}
                className="w-full h-64 object-cover rounded-t-2xl"
                onError={(e) => {
                  e.target.src = '/avatar.png';
                }}
              />
              <button 
                onClick={() => setShowProfile(false)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                <FiX size={20} className="text-white" />
              </button>
              <div className="absolute bottom-4 left-4 text-white">
                <h2 className="text-2xl font-bold">{otherUserName}</h2>
                {otherUser?.age && (
                  <p className="text-lg opacity-90">{otherUser.age} years old</p>
                )}
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-4">
              {otherUser?.bio && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">About</h3>
                  <p className="text-slate-300 leading-relaxed">{otherUser.bio}</p>
                </div>
              )}

              {otherUser?.location && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Location</h3>
                  <p className="text-slate-300">{otherUser.location}</p>
                </div>
              )}


              {/* Additional Photos */}
              {otherUser?.photos && otherUser.photos.length > 1 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">More Photos</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {otherUser.photos.slice(1, 5).map((photo, index) => (
                      <img 
                        key={index}
                        src={photo.photo}
                        alt={`${otherUserName} photo ${index + 2}`}
                        className="w-full h-24 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = '/avatar.png';
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button 
                onClick={() => setShowProfile(false)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-3 rounded-xl font-medium transition-all"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}