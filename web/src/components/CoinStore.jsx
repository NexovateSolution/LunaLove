import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiCreditCard, FiGift, FiArrowLeft } from 'react-icons/fi';

export default function CoinStore({ onBack }) {
  const [packages, setPackages] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [packagesRes, walletRes] = await Promise.all([
        fetch('/api/coins/packages/', {
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

      if (packagesRes.ok && walletRes.ok) {
        setPackages(await packagesRes.json());
        setWallet(await walletRes.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId) => {
    setPurchasing(packageId);
    
    try {
      const response = await fetch('/api/coins/purchase/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ package_id: packageId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.checkout_url) {
          // Store purchase ID for receipt page
          localStorage.setItem('last_coin_ref', data.purchase_id);
          // Redirect to Chapa checkout
          window.location.href = data.checkout_url;
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Purchase failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setPurchasing(null);
    }
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
          <h1 className="text-xl font-bold">Coin Store</h1>
          <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-full">
            <FiDollarSign className="text-yellow-400" />
            <span className="font-semibold">{wallet?.coins || 0}</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Wallet Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mb-4">
              <FiDollarSign size={32} className="text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your Wallet</h2>
            <div className="text-4xl font-bold text-yellow-400 mb-2">
              {wallet?.coins || 0} <span className="text-lg">coins</span>
            </div>
            <p className="text-white/70">
              Total Earned: {wallet?.total_earned || 0} ETB
            </p>
          </div>
        </div>

        {/* Coin Packages */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-center mb-4">Buy Coins</h3>
          
          {packages.map((pkg) => (
            <div 
              key={pkg.id}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-lg">{pkg.name}</h4>
                    {pkg.bonus_coins > 0 && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        +{pkg.bonus_coins} Bonus!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-white/80">
                    <span className="flex items-center gap-1">
                      <FiDollarSign className="text-yellow-400" />
                      {pkg.total_coins} coins
                    </span>
                    <span className="text-green-400 font-semibold">
                      {pkg.price_etb} ETB
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={purchasing === pkg.id}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-xl font-medium transition-all flex items-center gap-2"
                >
                  {purchasing === pkg.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <FiCreditCard size={16} />
                      Buy
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="bg-blue-500/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-500/30">
          <div className="flex items-start gap-3">
            <FiGift className="text-blue-400 mt-1" size={20} />
            <div>
              <h4 className="font-semibold mb-1">How it works</h4>
              <p className="text-sm text-white/80">
                Buy coins to send gifts to other users. When you send gifts, the recipient earns real money that they can withdraw to their bank account!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
