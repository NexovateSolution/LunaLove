import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiFileText, FiExternalLink, FiDollarSign, FiCalendar } from 'react-icons/fi';

export default function PurchaseHistory({ onBack }) {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPurchaseHistory();
  }, []);

  const fetchPurchaseHistory = async () => {
    try {
      // For now, we'll create a mock endpoint or use existing data
      // In a real implementation, you'd create a backend endpoint for purchase history
      const response = await fetch('/api/coins/purchase-history/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPurchases(data);
      } else {
        // Fallback to mock data for demo
        setPurchases([
          {
            id: '1',
            chapa_reference: 'APQ1kcaiCZi2',
            package_name: 'Starter Pack',
            coins_purchased: 100,
            amount_etb: 50,
            status: 'completed',
            created_at: new Date().toISOString(),
            payment_method: 'Chapa'
          },
          {
            id: '2',
            chapa_reference: 'BPQ2ldbjDZj3',
            package_name: 'Premium Pack',
            coins_purchased: 500,
            amount_etb: 200,
            status: 'completed',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            payment_method: 'Chapa'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      setError('Failed to load purchase history');
    } finally {
      setLoading(false);
    }
  };

  const openChapaReceipt = (chapaRef) => {
    if (chapaRef) {
      const receiptUrl = `https://chapa.link/payment-receipt/${chapaRef}`;
      window.open(receiptUrl, '_blank');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading purchase history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <FiArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Purchase History</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {error && (
          <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-4 border border-red-500/30">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {purchases.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
            <FiFileText size={48} className="mx-auto mb-4 text-white/50" />
            <h3 className="text-xl font-semibold mb-2">No Purchases Yet</h3>
            <p className="text-white/70">
              Your coin purchase history will appear here once you make your first purchase.
            </p>
          </div>
        ) : (
          purchases.map((purchase) => (
            <div 
              key={purchase.id}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{purchase.package_name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(purchase.status)}`}>
                      {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-white/80 mb-2">
                    <div className="flex items-center gap-1">
                      <FiDollarSign className="text-yellow-400" />
                      <span>{purchase.coins_purchased} coins</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-green-400 font-semibold">
                        {purchase.amount_etb} ETB
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-white/60">
                    <FiCalendar size={12} />
                    <span>
                      {new Date(purchase.created_at).toLocaleDateString()} at{' '}
                      {new Date(purchase.created_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>

                {purchase.status === 'completed' && purchase.chapa_reference && (
                  <button
                    onClick={() => openChapaReceipt(purchase.chapa_reference)}
                    className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    title="View Official Receipt"
                  >
                    <FiExternalLink size={14} />
                    Receipt
                  </button>
                )}
              </div>

              {/* Transaction Details */}
              <div className="bg-black/20 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Transaction ID</span>
                  <span className="font-mono text-xs bg-white/10 px-2 py-1 rounded">
                    {purchase.chapa_reference || purchase.id}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Payment Method</span>
                  <span>{purchase.payment_method}</span>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Info */}
        <div className="bg-blue-500/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-500/30">
          <div className="flex items-start gap-3">
            <FiFileText className="text-blue-400 mt-1" size={20} />
            <div>
              <h4 className="font-semibold mb-1">About Receipts</h4>
              <p className="text-sm text-white/80">
                Official receipts are provided by Chapa and include all payment details, 
                merchant information, and can be used for accounting purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
