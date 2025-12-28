import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiGift, FiCreditCard, FiTrendingUp, FiSettings, FiArrowLeft } from 'react-icons/fi';
import CoinStore from './CoinStore';
import GiftHistory from './GiftHistory';
import BankAccountSetup from './BankAccountSetup';
import PurchaseHistory from './PurchaseHistory';

export default function GiftsDashboard({ onBack, onNavigate }) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [wallet, setWallet] = useState(null);
  const [recentGifts, setRecentGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasSubAccount, setHasSubAccount] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [walletRes, giftsRes] = await Promise.all([
        fetch('/api/coins/wallet/', {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`,
          },
        }),
        fetch('/api/gifts/history/?type=all', {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`,
          },
        })
      ]);

      if (walletRes.ok) {
        setWallet(await walletRes.json());
      }

      if (giftsRes.ok) {
        const gifts = await giftsRes.json();
        setRecentGifts(gifts.slice(0, 3)); // Show only recent 3
      }

      // Check if user has subaccount
      // This would be part of user profile or separate endpoint
      // For now, we'll assume they don't have one initially
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubAccountComplete = (subAccount) => {
    setHasSubAccount(true);
    setCurrentView('dashboard');
  };

  if (currentView === 'coins') {
    return <CoinStore onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'history') {
    return <GiftHistory onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'purchase-history') {
    return <PurchaseHistory onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'bank-setup') {
    return (
      <BankAccountSetup 
        onBack={() => setCurrentView('dashboard')}
        onComplete={handleSubAccountComplete}
      />
    );
  }

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
          <h1 className="text-xl font-bold">Gifts & Coins</h1>
          <button 
            onClick={() => onNavigate && onNavigate('settings')}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Settings"
          >
            <FiSettings size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Wallet Overview */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mb-4">
              <FiDollarSign size={32} className="text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your Wallet</h2>
            <div className="text-4xl font-bold text-yellow-400 mb-4">
              {wallet?.coins || 0} <span className="text-lg">coins</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-white/70">Total Spent</div>
                <div className="font-semibold text-red-400">{wallet?.total_spent || 0} ETB</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-white/70">Total Earned</div>
                <div className="font-semibold text-green-400">{wallet?.total_earned || 0} ETB</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setCurrentView('coins')}
            className="bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 rounded-2xl p-4 transition-all"
          >
            <div className="flex flex-col items-center text-center">
              <FiCreditCard size={24} className="mb-2" />
              <span className="font-semibold">Buy Coins</span>
              <span className="text-xs text-purple-200">Purchase more coins</span>
            </div>
          </button>

          <button
            onClick={() => setCurrentView('history')}
            className="bg-gradient-to-br from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800 rounded-2xl p-4 transition-all"
          >
            <div className="flex flex-col items-center text-center">
              <FiGift size={24} className="mb-2" />
              <span className="font-semibold">Gift History</span>
              <span className="text-xs text-pink-200">View sent & received</span>
            </div>
          </button>
        </div>

        {/* Purchase History */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiCreditCard className="text-blue-400" />
              <h3 className="font-semibold">Purchase History</h3>
            </div>
            <button
              onClick={() => setCurrentView('purchase-history')}
              className="text-blue-400 text-sm hover:underline"
            >
              View All
            </button>
          </div>
          <p className="text-white/70 text-sm">
            View your coin purchase receipts and transaction history
          </p>
        </div>

        {/* Premium Features Link */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-4 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiTrendingUp className="text-yellow-400" size={20} />
              <div>
                <h4 className="font-semibold">Premium Features</h4>
                <p className="text-sm text-white/80">Unlock unlimited likes & more</p>
              </div>
            </div>
            <button
              onClick={() => {
                // Navigate to premium/purchase page
                if (onNavigate) {
                  onNavigate('purchase');
                } else if (onBack) {
                  onBack(); // Go back to main app
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('navigate-to-premium'));
                  }, 100);
                }
              }}
              className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg text-sm font-medium text-black transition-colors"
            >
              Upgrade
            </button>
          </div>
        </div>

        {/* Bank Account Status */}
        {!hasSubAccount && (
          <div className="bg-orange-500/20 backdrop-blur-sm rounded-2xl p-4 border border-orange-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiTrendingUp className="text-orange-400" size={20} />
                <div>
                  <h4 className="font-semibold">Setup Bank Account</h4>
                  <p className="text-sm text-white/80">Start earning from gifts!</p>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('bank-setup')}
                className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Setup
              </button>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Activity</h3>
            <button
              onClick={() => setCurrentView('history')}
              className="text-purple-400 text-sm hover:text-purple-300"
            >
              View All
            </button>
          </div>

          {recentGifts.length === 0 ? (
            <div className="text-center py-8">
              <FiGift size={32} className="mx-auto text-white/30 mb-2" />
              <p className="text-white/70 text-sm">No gift activity yet</p>
              <p className="text-white/50 text-xs">Start sending gifts to see activity here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentGifts.map((gift) => (
                <div key={gift.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <div className="text-2xl">{gift.gift_icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {gift.quantity}x {gift.gift_name}
                    </div>
                    <div className="text-xs text-white/70">
                      {/* Show direction based on current user */}
                      To/From {gift.sender_name || gift.receiver_name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-yellow-400">
                      {gift.total_coins} coins
                    </div>
                    <div className="text-xs text-green-400">
                      {gift.total_etb_value} ETB
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="bg-blue-500/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-500/30">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <FiGift className="text-blue-400" />
            How Gifts Work
          </h4>
          <div className="space-y-2 text-sm text-white/80">
            <div className="flex items-start gap-2">
              <span className="text-blue-400">1.</span>
              <span>Buy coins with real money</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400">2.</span>
              <span>Send gifts to other users using coins</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400">3.</span>
              <span>Recipients earn 70% of gift value in their bank account</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400">4.</span>
              <span>Platform keeps 30% to maintain the service</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
