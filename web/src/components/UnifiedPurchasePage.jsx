import React, { useState, useEffect } from 'react';
import { FaSpinner, FaCrown, FaHeart, FaEye, FaBolt } from 'react-icons/fa';
import { FiArrowLeft, FiCheck, FiStar, FiShield, FiDollarSign, FiGift, FiSettings, FiTrendingUp } from 'react-icons/fi';
import { initializePayment, getSubscriptionPlans, subscribeToPlan, getCoinPackages, getWallet } from '../api';

const UnifiedPurchasePage = ({ currentUser, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('premium'); // 'premium' or 'gifts'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Premium/Subscription state
  const [plans, setPlans] = useState([]);
  const [subError, setSubError] = useState(null);
  const [subscribeBusyId, setSubscribeBusyId] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
  });

  // Gift system state
  const [coinPackages, setCoinPackages] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [purchasing, setPurchasing] = useState(null);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        email: currentUser.email || '',
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
      });
    }
  }, [currentUser]);

  // Fetch subscription plans
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getSubscriptionPlans();
        if (!mounted) return;
        setPlans(data || []);
      } catch (e) {
        console.error('Failed to fetch subscription plans:', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch coin packages and wallet
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [packagesData, walletData] = await Promise.all([
          getCoinPackages(),
          getWallet().catch(() => ({ coins: 0, total_spent: 0, total_earned: 0 }))
        ]);
        if (!mounted) return;
        setCoinPackages(packagesData || []);
        setWallet(walletData);
      } catch (e) {
        console.error('Failed to fetch coin data:', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSubscribe = async (planId) => {
    setSubscribeBusyId(planId);
    setSubError(null);
    
    try {
      const result = await subscribeToPlan(planId);
      if (result?.success && result?.checkout_url) {
        // Store purchase info for tracking
        localStorage.setItem('last_subscription_purchase_id', result.purchase_id);
        localStorage.setItem('last_subscription_tx_ref', result.tx_ref);
        
        // Redirect to Chapa checkout
        window.location.href = result.checkout_url;
      } else {
        setSubError(result?.error || 'Could not initiate checkout.');
      }
    } catch (e) {
      console.error('Subscription error:', e);
      const errorMsg = e.response?.data?.error || e.response?.data?.detail || 'Failed to start subscription.';
      setSubError(errorMsg);
    } finally {
      setSubscribeBusyId(null);
    }
  };

  const handleCoinPurchase = async (packageId) => {
    setPurchasing(packageId);
    setError(null);
    
    try {
      const selectedPackage = coinPackages.find(pkg => pkg.id === packageId);
      if (!selectedPackage) {
        setError('Package not found');
        setPurchasing(null);
        return;
      }

      // Call backend to initialize Chapa payment
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/coins/purchase/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ package_id: packageId })
      });

      const data = await response.json();
      
      console.log('Payment API response:', data);

      if (response.ok && data.success && data.checkout_url) {
        // Store purchase ID for receipt page
        localStorage.setItem('last_coin_purchase_id', data.purchase_id);
        localStorage.setItem('last_coin_tx_ref', data.tx_ref);
        
        // Redirect to Chapa checkout
        window.location.href = data.checkout_url;
      } else {
        console.error('Payment initialization failed:', data);
        setError(data.error || 'Failed to initialize payment');
        setPurchasing(null);
      }
    } catch (e) {
      console.error('Purchase error:', e);
      setError('Failed to initiate purchase. Please try again later.');
      setPurchasing(null);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate && onNavigate('home')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <FiArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Premium & Gifts
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enhance your dating experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="flex bg-white dark:bg-slate-800 rounded-2xl p-1 shadow-sm border border-gray-200 dark:border-slate-700 mb-8">
          <button
            onClick={() => setActiveTab('premium')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all ${
              activeTab === 'premium'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FaCrown size={18} />
            Premium Plans
          </button>
          <button
            onClick={() => setActiveTab('gifts')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all ${
              activeTab === 'gifts'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FiGift size={18} />
            Gifts & Coins
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-8">
        {activeTab === 'premium' ? (
          // Premium Plans Section
          <div>
            {/* Quick Coins Access */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-1 shadow-xl">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center">
                        <FiDollarSign size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Send Gifts</h3>
                        <p className="text-gray-600 dark:text-gray-400">Buy coins and send romantic gifts</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('gifts')}
                      className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      View Gifts
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Plans */}
            <div className="mb-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Premium Subscriptions</h2>
                <p className="text-gray-600 dark:text-gray-400">Unlock unlimited likes, boosts, and premium features</p>
              </div>
              
              {subError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                  <p className="text-red-600 dark:text-red-400 text-center">{subError}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan, index) => {
                  const isPopular = index === 1;
                  
                  let IconComponent = FiStar;
                  let iconColor = 'from-purple-500 to-pink-600';
                  let bgColor = 'from-purple-50 to-pink-50';
                  
                  if (plan.name && plan.name.includes('Boost')) {
                    IconComponent = FaBolt;
                    iconColor = 'from-orange-500 to-red-600';
                    bgColor = 'from-orange-50 to-red-50';
                  } else if (plan.name && plan.name.includes('Likes')) {
                    IconComponent = FaHeart;
                    iconColor = 'from-pink-500 to-rose-600';
                    bgColor = 'from-pink-50 to-rose-50';
                  } else if (plan.name && plan.name.includes('Ad-Free')) {
                    IconComponent = FiShield;
                    iconColor = 'from-blue-500 to-indigo-600';
                    bgColor = 'from-blue-50 to-indigo-50';
                  }
                  
                  return (
                    <div key={plan.id} className={`relative ${isPopular ? 'transform scale-105' : ''}`}>
                      {isPopular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                            Most Popular
                          </div>
                        </div>
                      )}
                      
                      <div className={`bg-gradient-to-br ${bgColor} dark:from-slate-800 dark:to-slate-700 rounded-3xl p-1 shadow-xl ${isPopular ? 'ring-2 ring-purple-500' : ''}`}>
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 h-full">
                          <div className="text-center mb-6">
                            <div className={`w-16 h-16 bg-gradient-to-r ${iconColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                              <IconComponent size={28} className="text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                              {plan.price_etb} <span className="text-lg text-gray-600 dark:text-gray-400">ETB</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">{plan.duration_days} days</p>
                          </div>
                          
                          <div className="space-y-3 mb-6">
                            {plan.features && plan.features.map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <FiCheck className="text-green-500 flex-shrink-0" size={16} />
                                <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                              </div>
                            ))}
                          </div>
                          
                          <button
                            onClick={() => handleSubscribe(plan.id)}
                            disabled={subscribeBusyId === plan.id}
                            className={`w-full py-3 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                              isPopular
                                ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                                : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-900 dark:text-white'
                            }`}
                          >
                            {subscribeBusyId === plan.id ? (
                              <FaSpinner className="animate-spin mx-auto" size={20} />
                            ) : (
                              'Subscribe Now'
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
        ) : (
          // Gifts & Coins Section
          <div>
            {/* Wallet Overview */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-1 shadow-xl">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FiDollarSign size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your Wallet</h2>
                    <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mb-4">
                      {wallet?.coins || 0} <span className="text-lg text-gray-600 dark:text-gray-400">coins</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-3">
                        <div className="text-gray-600 dark:text-gray-400">Total Spent</div>
                        <div className="font-semibold text-red-500">{wallet?.total_spent || 0} ETB</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-3">
                        <div className="text-gray-600 dark:text-gray-400">Total Earned</div>
                        <div className="font-semibold text-green-500">{wallet?.total_earned || 0} ETB</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coin Packages */}
            <div className="mb-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Buy Coins</h2>
                <p className="text-gray-600 dark:text-gray-400">Purchase coins to send gifts and show your affection</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                  <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coinPackages.map((pkg, index) => {
                  const isPopular = index === 1;
                  
                  return (
                    <div key={pkg.id} className={`relative ${isPopular ? 'transform scale-105' : ''}`}>
                      {isPopular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                          <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                            Best Value
                          </div>
                        </div>
                      )}
                      
                      <div className={`bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-slate-800 dark:to-slate-700 rounded-3xl p-1 shadow-xl ${isPopular ? 'ring-2 ring-yellow-500' : ''}`}>
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 h-full">
                          <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <FiDollarSign size={28} className="text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{pkg.name}</h3>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                              {pkg.price_etb} <span className="text-lg text-gray-600 dark:text-gray-400">ETB</span>
                            </div>
                            <div className="text-yellow-600 dark:text-yellow-400 font-semibold">
                              {pkg.total_coins} coins
                            </div>
                            {pkg.bonus_coins > 0 && (
                              <div className="text-green-500 text-sm font-medium">
                                +{pkg.bonus_coins} bonus coins!
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={() => handleCoinPurchase(pkg.id)}
                            disabled={purchasing === pkg.id}
                            className={`w-full py-3 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                              isPopular
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl'
                                : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-900 dark:text-white'
                            }`}
                          >
                            {purchasing === pkg.id ? (
                              <FaSpinner className="animate-spin mx-auto" size={20} />
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

            {/* How Gifts Work */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-3xl p-1 shadow-xl">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FiGift className="text-blue-500" />
                  How Gifts Work
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                    <span>Buy coins with real money</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                    <span>Send gifts to other users using coins</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                    <span>Recipients earn 70% of gift value in their bank account</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
                    <span>Platform keeps 30% to maintain the service</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedPurchasePage;
