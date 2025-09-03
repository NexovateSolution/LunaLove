import React, { useState, useEffect } from 'react';
import { FaSpinner, FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import { initializePayment } from '../api';

const PurchasePage = ({ currentUser }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Sheba Love</h1>
          <p className="text-gray-500 dark:text-gray-400">Complete your payment</p>
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <label htmlFor="fullName" className="text-sm font-medium text-gray-600 dark:text-gray-300">Full Name</label>
            <div className="relative mt-1">
              <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                id="fullName"
                value={`${formData.first_name} ${formData.last_name}`}
                readOnly
                className="w-full pl-10 pr-3 py-2 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-600 dark:text-gray-300">Email Address</label>
            <div className="relative mt-1">
              <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                id="email"
                value={formData.email}
                readOnly
                className="w-full pl-10 pr-3 py-2 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="bg-fuchsia-50 dark:bg-slate-700 rounded-lg p-4 mb-8">
          <div className="flex justify-between items-center text-gray-800 dark:text-gray-100">
            <span className="font-medium">1 Month Premium</span>
            <span className="font-bold text-lg">$9.99</span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span>Tax</span>
            <span>$0.00</span>
          </div>
          <hr className="my-3 border-gray-200 dark:border-slate-600" />
          <div className="flex justify-between items-center text-gray-800 dark:text-gray-100 font-bold text-xl">
            <span>Total</span>
            <span>$9.99</span>
          </div>
        </div>

        {error && <p className="text-red-500 text-center text-sm mb-4">{error}</p>}

        <button
          onClick={handlePurchase}
          disabled={isLoading}
          className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-opacity-50 disabled:bg-fuchsia-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? <FaSpinner className="animate-spin mr-2" /> : `Pay $9.99`}
        </button>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center">
            <FaLock className="mr-1.5" /> Secure Payment by Chapa
          </p>
        </div>
      </div>
    </div>
  );
};

export default PurchasePage;
