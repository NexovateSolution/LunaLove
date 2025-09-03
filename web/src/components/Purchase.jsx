import React, { useState } from 'react';
import { FiCreditCard, FiLoader } from 'react-icons/fi';
import api from '../api.js';

export default function Purchase() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePurchase = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/initialize-payment/');
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error('Could not retrieve payment URL.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Unlock Premium Features</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Get unlimited swipes, see who likes you, and much more with ShebaLove Premium.
        </p>
        <button
          onClick={handlePurchase}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-fuchsia-600 text-white px-6 py-4 rounded-lg shadow-md hover:bg-fuchsia-700 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <FiLoader className="animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <FiCreditCard />
              <span>Purchase with Chapa</span>
            </>
          )}
        </button>
        {error && <p className="mt-4 text-red-500">Error: {error}</p>}
      </div>
    </div>
  );
}
