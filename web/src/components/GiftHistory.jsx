import React, { useState, useEffect } from 'react';
import { FiGift, FiArrowLeft, FiArrowRight, FiHeart, FiDollarSign } from 'react-icons/fi';

export default function GiftHistory({ onBack }) {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'sent', 'received'

  useEffect(() => {
    fetchGifts();
  }, [filter]);

  const fetchGifts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/gifts/history/?type=${filter}`, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setGifts(await response.json());
      }
    } catch (error) {
      console.error('Error fetching gift history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <FiArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Gift History</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Filter Tabs */}
        <div className="flex bg-white/10 backdrop-blur-sm rounded-2xl p-1 mb-6">
          {[
            { key: 'all', label: 'All', icon: FiGift },
            { key: 'sent', label: 'Sent', icon: FiArrowRight },
            { key: 'received', label: 'Received', icon: FiArrowLeft }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl transition-all ${
                filter === key
                  ? 'bg-white text-purple-900 font-semibold'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Gift List */}
        <div className="space-y-3">
          {gifts.length === 0 ? (
            <div className="text-center py-12">
              <FiGift size={48} className="mx-auto text-white/30 mb-4" />
              <p className="text-white/70">No gifts {filter === 'all' ? 'yet' : filter}</p>
            </div>
          ) : (
            gifts.map((gift) => (
              <div 
                key={gift.id}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20"
              >
                <div className="flex items-center gap-4">
                  {/* Gift Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-2xl">
                      {gift.gift_icon}
                    </div>
                  </div>

                  {/* Gift Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">
                        {gift.quantity}x {gift.gift_name}
                      </h3>
                      {gift.quantity > 1 && (
                        <span className="bg-purple-500/30 text-purple-200 text-xs px-2 py-1 rounded-full">
                          ×{gift.quantity}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-white/70">
                        {filter === 'sent' ? (
                          <span>To {gift.receiver_name}</span>
                        ) : filter === 'received' ? (
                          <span>From {gift.sender_name}</span>
                        ) : (
                          <span>
                            {gift.sender_name === gift.receiver_name ? 'To' : 'From'} {' '}
                            {gift.sender_name === gift.receiver_name ? gift.receiver_name : gift.sender_name}
                          </span>
                        )}
                      </div>
                      <div className="text-white/50 text-xs">
                        {formatDate(gift.created_at)}
                      </div>
                    </div>

                    {/* Message */}
                    {gift.message && (
                      <div className="mt-2 bg-white/5 rounded-lg p-2">
                        <p className="text-white/80 text-sm italic">"{gift.message}"</p>
                      </div>
                    )}

                    {/* Value */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-yellow-400">
                          <FiDollarSign size={12} />
                          {gift.total_coins}
                        </span>
                        <span className="text-green-400">
                          {gift.total_etb_value} ETB
                        </span>
                      </div>
                      
                      {filter === 'received' && (
                        <div className="text-xs text-green-400">
                          +{gift.receiver_share_etb} ETB earned
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Direction Indicator */}
                  <div className="flex-shrink-0">
                    {filter === 'all' && (
                      <div className={`p-2 rounded-full ${
                        gift.sender_name === gift.receiver_name 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {gift.sender_name === gift.receiver_name ? (
                          <FiArrowRight size={16} />
                        ) : (
                          <FiArrowLeft size={16} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
