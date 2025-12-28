import React, { useEffect, useState } from "react";
import { FiDollarSign, FiX, FiHeart, FiSend, FiMinus, FiPlus } from 'react-icons/fi';

export default function EnhancedGiftStore({ onClose, onSend, receiverName, receiverId }) {
  const [gifts, setGifts] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGift, setSelectedGift] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [giftsRes, walletRes] = await Promise.all([
        fetch('/api/gifts/types/', {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`,
          },
        }),
        fetch('/api/coins/wallet/', {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`,
          },
        })
      ]);

      if (giftsRes.ok && walletRes.ok) {
        setGifts(await giftsRes.json());
        setWallet(await walletRes.json());
      } else {
        setError('Failed to load gifts');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load gifts');
    } finally {
      setLoading(false);
    }
  };

  const handleSendGift = async () => {
    if (!selectedGift || !receiverId) return;

    setSending(true);
    try {
      const response = await fetch('/api/gifts/send/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          receiver_id: receiverId,
          gift_type_id: selectedGift.id,
          quantity: quantity,
          message: message.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update wallet
          setWallet(prev => ({ ...prev, coins: data.sender_coins_remaining }));
          
          // Call parent callback
          if (onSend) {
            onSend(data.gift);
          }
          
          // Close modal
          onClose();
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to send gift');
      }
    } catch (err) {
      console.error('Error sending gift:', err);
      alert('Failed to send gift. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const getTotalCost = () => {
    return selectedGift ? selectedGift.coin_cost * quantity : 0;
  };

  const canAfford = () => {
    return wallet && getTotalCost() <= wallet.coins;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Send Gift</h2>
            <p className="text-purple-100">to {receiverName}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
              <FiDollarSign className="text-yellow-300" />
              <span className="text-white font-semibold">{wallet?.coins || 0}</span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <FiX size={20} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Gift Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Choose a Gift</h3>
            <div className="grid grid-cols-2 gap-3">
              {gifts.map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => setSelectedGift(gift)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedGift?.id === gift.id
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{gift.icon}</div>
                    <div className="text-white font-medium text-sm">{gift.name}</div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <FiDollarSign className="text-yellow-400 text-xs" />
                      <span className="text-yellow-400 text-xs font-semibold">
                        {gift.coin_cost}
                      </span>
                    </div>
                    <div className="text-green-400 text-xs">
                      {gift.etb_value} ETB
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity and Message */}
          {selectedGift && (
            <div className="space-y-4">
              {/* Quantity */}
              <div>
                <label className="block text-white font-medium mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    <FiMinus className="text-white" />
                  </button>
                  <span className="text-white font-semibold text-lg min-w-[40px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    <FiPlus className="text-white" />
                  </button>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-white font-medium mb-2">Message (Optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a sweet message..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>

              {/* Total Cost */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between text-white">
                  <span>Total Cost:</span>
                  <div className="flex items-center gap-2">
                    <FiDollarSign className="text-yellow-400" />
                    <span className="font-bold text-lg">{getTotalCost()}</span>
                  </div>
                </div>
                {!canAfford() && (
                  <p className="text-red-400 text-sm mt-2">
                    Insufficient coins. You need {getTotalCost() - (wallet?.coins || 0)} more coins.
                  </p>
                )}
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendGift}
                disabled={sending || !canAfford()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <FiSend size={18} />
                    Send Gift
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
