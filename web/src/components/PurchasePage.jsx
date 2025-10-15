import React, { useState, useEffect } from 'react';
import { FaSpinner, FaUser, FaEnvelope, FaLock, FaCrown, FaHeart, FaEye, FaBolt } from 'react-icons/fa';
import { FiArrowLeft, FiCheck, FiStar, FiShield } from 'react-icons/fi';
import { initializePayment, getSubscriptionPlans, subscribeToPlan } from '../api';

const PurchasePage = ({ currentUser, onNavigate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plans, setPlans] = useState([]);
  const [subError, setSubError] = useState(null);
  const [subscribeBusyId, setSubscribeBusyId] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        email: currentUser.email || '',
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
      });
    }
  }, [currentUser]);

  // Fetch subscription plans on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setSubError(null);
        const data = await getSubscriptionPlans();
        if (!mounted) return;
        setPlans(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!mounted) return;
        setSubError(e.message || 'Failed to load subscription plans');
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handlePurchase = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Generate a client-side reference to ensure we always have a tx_ref fallback
      const clientTxRef = (() => {
        try {
          if (crypto && typeof crypto.randomUUID === 'function') return `SB-${crypto.randomUUID()}`;
        } catch (_) {}
        return `SB-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      })();

      // Persist immediately so success page can use it even if provider strips query params
      try {
        localStorage.setItem('last_tx_ref', clientTxRef);
        console.debug('Prepared client tx_ref and stored:', clientTxRef);
      } catch (_) {}

      const response = await initializePayment({ tx_ref: clientTxRef, reference: clientTxRef, trx_ref: clientTxRef });
      if (response.checkout_url) {
        // Persist a fallback tx_ref so the success page can verify even if the provider
        // returns via hash routing or omits the ref in the callback URL
        try {
          const txRefFromResponse = response.tx_ref || response.trx_ref || response.reference || null;
          let txRef = txRefFromResponse;
          if (!txRef) {
            const url = new URL(response.checkout_url);
            txRef = url.searchParams.get('tx_ref') || url.searchParams.get('trx_ref') || url.searchParams.get('reference');
          }
          if (txRef) {
            localStorage.setItem('last_tx_ref', txRef);
            try { console.debug('Stored last_tx_ref before redirect:', txRef); } catch (_) {}
          }
        } catch (_) { /* noop */ }
        window.location.href = response.checkout_url;
      } else {
        setError('Could not retrieve payment URL. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while initiating the payment. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (plan) => {
    setSubscribeBusyId(plan.id);
    setSubError(null);
    try {
      const res = await subscribeToPlan(plan.id);
      const checkout = res?.checkout_url;
      if (checkout) {
        window.location.href = checkout;
      } else {
        setSubError('Could not initiate checkout.');
      }
    } catch (e) {
      console.error(e);
      setSubError('Failed to start subscription.');
    } finally {
      setSubscribeBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <FiArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Premium Plans
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unlock the full ShebaLove experience</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Buy Coins Card */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-1 shadow-xl">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">🪙</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Buy Coins</h3>
                    <p className="text-gray-600 dark:text-gray-400">Send romantic gifts to your matches</p>
                  </div>
                </div>
                <button
                  onClick={() => { if (onNavigate) onNavigate('buy-coins'); try { window.history.pushState({}, '', '/buy-coins'); } catch (_) {} }}
                  className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Upgrade Your Experience</h2>
            <p className="text-gray-600 dark:text-gray-400">Choose the perfect plan to enhance your dating journey</p>
          </div>
          
          {subError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
              <p className="text-red-600 dark:text-red-400 text-center">{subError}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => {
              const isPopular = index === 1; // Middle plan is popular
              
              // Simple icon selection
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
                  
                  <div className={`bg-white dark:bg-slate-800 rounded-3xl shadow-xl border-2 ${
                    isPopular ? 'border-purple-500' : 'border-gray-200 dark:border-slate-700'
                  } overflow-hidden transition-all duration-200 hover:shadow-2xl hover:scale-105`}>
                    
                    {/* Plan Header */}
                    <div className={`bg-gradient-to-r ${bgColor} dark:from-slate-700 dark:to-slate-600 p-6 text-center`}>
                      <div className={`w-16 h-16 bg-gradient-to-r ${iconColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                        <IconComponent className="text-2xl text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name || 'Premium Plan'}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">{plan.description || 'Enhance your experience'}</p>
                    </div>
                    
                    {/* Plan Content */}
                    <div className="p-6">
                      <div className="text-center mb-6">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          ETB {plan.price_etb}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-sm">per month</div>
                      </div>
                      
                      {/* Features */}
                      <div className="space-y-3 mb-6">
                        {plan.name === 'Boost Plan' && (
                          <>
                            <div className="flex items-center gap-3">
                              <FiCheck className="text-green-500 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300 text-sm">Get featured more</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <FiCheck className="text-green-500 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300 text-sm">Reach more profiles</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <FiCheck className="text-green-500 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300 text-sm">Better matching</span>
                            </div>
                          </>
                        )}
                        {plan.name === 'Likes Reveal Plan' && (
                          <>
                            <div className="flex items-center gap-3">
                              <FiCheck className="text-green-500 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300 text-sm">See who liked you</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <FiCheck className="text-green-500 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300 text-sm">Decide if you like them back</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <FiCheck className="text-green-500 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300 text-sm">Skip the guessing</span>
                            </div>
                          </>
                        )}
                        {plan.name === 'Ad-Free Plan' && (
                          <>
                            <div className="flex items-center gap-3">
                              <FiCheck className="text-green-500 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300 text-sm">Remove all ads</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <FiCheck className="text-green-500 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300 text-sm">Smooth swiping</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <FiCheck className="text-green-500 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300 text-sm">Distraction-free experience</span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleSubscribe(plan)}
                        disabled={subscribeBusyId === plan.id}
                        className={`w-full py-3 px-4 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                          isPopular
                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                            : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-900 dark:text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                      >
                        {subscribeBusyId === plan.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <FaSpinner className="animate-spin" />
                            Processing...
                          </div>
                        ) : (
                          'Subscribe'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {plans.length === 0 && !subError && (
              <div className="col-span-full text-center py-12">
                <div className="animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-32 mx-auto"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full">
            <FiShield className="text-green-600 dark:text-green-400" size={16} />
            <span className="text-green-700 dark:text-green-300 text-sm font-medium">Secure Payment by Chapa</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchasePage;
