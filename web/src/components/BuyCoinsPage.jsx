import React, { useEffect, useState } from 'react';
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { getCoinPackages, createTopUp, getWallet } from '../api';

export default function BuyCoinsPage({ onBack }) {
  const [packages, setPackages] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [btnBusyId, setBtnBusyId] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [pkgs, w] = await Promise.all([
          getCoinPackages().catch((e) => { throw new Error('Failed to load coin packages'); }),
          getWallet().catch(() => null),
        ]);
        if (!mounted) return;
        setPackages(pkgs || []);
        if (w) setWallet(w);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'Could not load coin packages');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();

    const onFocus = async () => {
      try {
        const w = await getWallet();
        setWallet(w);
      } catch (_) {}
    };
    window.addEventListener('focus', onFocus);
    return () => {
      mounted = false;
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const handleBuy = async (pkg) => {
    setBtnBusyId(pkg.id);
    try {
      const data = await createTopUp(pkg.id);
      if (data?.success && data?.checkout_url) {
        try {
          const ref = data?.purchase_id || null;
          if (ref) localStorage.setItem('last_coin_ref', ref);
        } catch (_) {}
        window.location.href = data.checkout_url;
      } else {
        setError('Could not get checkout URL');
      }
    } catch (e) {
      console.error(e);
      setError('Failed to start top-up');
    } finally {
      setBtnBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { if (onBack) onBack(); window.history.pushState({}, '', '/purchase'); }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <FiArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  Buy Coins
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Send romantic gifts to your matches</p>
              </div>
            </div>
            
            {wallet && (
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">Current Balance</div>
                <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                  🪙 {wallet.coin_balance}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Info Card */}
        <div className="mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-1 shadow-xl">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">💝</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Send Romantic Gifts</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Use coins to send beautiful gifts in chat and make your conversations more special. 
                  Show your matches how much you care with thoughtful gestures.
                </p>
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Platform commission: 25% (VAT included)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading coin packages...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
            <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Coin Packages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg, index) => {
            const isPopular = index === 2; // Make the 3rd package popular
            
            // Safe coin amount handling
            const coinCount = pkg.coins || 0;
            let emoji = '🪙';
            let color = 'from-yellow-400 to-yellow-600';
            
            if (coinCount >= 1000) {
              emoji = '🏆';
              color = 'from-purple-500 to-pink-600';
            } else if (coinCount >= 500) {
              emoji = '👑';
              color = 'from-red-500 to-pink-600';
            } else if (coinCount >= 250) {
              emoji = '💎';
              color = 'from-orange-500 to-red-500';
            } else if (coinCount >= 100) {
              emoji = '💰';
              color = 'from-yellow-500 to-orange-500';
            }
            
            return (
              <div key={pkg.id} className={`relative ${isPopular ? 'transform scale-105' : ''}`}>
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Best Value
                    </div>
                  </div>
                )}
                
                <div className={`bg-white dark:bg-slate-800 rounded-3xl shadow-xl border-2 ${
                  isPopular ? 'border-yellow-500' : 'border-gray-200 dark:border-slate-700'
                } overflow-hidden transition-all duration-200 hover:shadow-2xl hover:scale-105`}>
                  
                  {/* Package Header */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-slate-700 dark:to-slate-600 p-6 text-center">
                    <div className={`w-16 h-16 bg-gradient-to-r ${color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      <span className="text-3xl">{emoji}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{coinCount}</h3>
                    <p className="text-gray-600 dark:text-gray-300">Coins</p>
                  </div>
                  
                  {/* Package Content */}
                  <div className="p-6">
                    <div className="text-center mb-6">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ETB {Number(pkg.price_total_etb).toFixed(2)}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm">Total Price</div>
                    </div>
                    
                    {/* Value Indicator */}
                    <div className="mb-6 p-3 bg-gray-50 dark:bg-slate-700 rounded-2xl">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Price per coin</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          ETB {coinCount > 0 ? (Number(pkg.price_total_etb || 0) / coinCount).toFixed(2) : '0.00'}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleBuy(pkg)}
                      disabled={btnBusyId === pkg.id}
                      className={`w-full py-3 px-4 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                        isPopular
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl'
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-slate-600 dark:hover:to-slate-500 text-gray-900 dark:text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                    >
                      {btnBusyId === pkg.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <FiRefreshCw className="animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        'Buy Now'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
