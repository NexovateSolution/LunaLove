import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiHome, FiLoader, FiXCircle } from 'react-icons/fi';
import api from '../api.js';

export default function PurchaseSuccess({ onNavigate }) {
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // 'verifying', 'success', 'failed'

  useEffect(() => {
    const verifyPayment = async () => {
      // Try to obtain the transaction reference from multiple possible sources
      const getTxRef = () => {
        const url = window.location.href;
        try { console.debug('PurchaseSuccess URL:', url); } catch (_) {}

        const search = window.location.search || '';
        const sp = new URLSearchParams(search);
        const fromSearch = sp.get('tx_ref') || sp.get('trx_ref') || sp.get('reference') || sp.get('transaction_id') || sp.get('transactionId');
        if (fromSearch) {
          try { console.debug('Found tx_ref in search:', fromSearch); } catch (_) {}
          return fromSearch;
        }

        const rawHash = window.location.hash || '';
        if (rawHash) {
          // Accept both '#/route?tx_ref=...' and '#tx_ref=...' and '#/route#tx_ref=...'
          const hashBody = rawHash.replace(/^#\/?/, '');
          const queryPart = hashBody.includes('?') ? hashBody.split('?')[1] : hashBody;
          if (queryPart && queryPart.includes('=')) {
            const hashParams = new URLSearchParams(queryPart);
            const fromHash = hashParams.get('tx_ref') || hashParams.get('trx_ref') || hashParams.get('reference') || hashParams.get('transaction_id') || hashParams.get('transactionId');
            if (fromHash) {
              try { console.debug('Found tx_ref in hash:', fromHash); } catch (_) {}
              return fromHash;
            }
          }

          // Try path-like hash '#/purchase-success/<tx_ref>'
          const hashPathSegs = hashBody.split('?')[0].split('#')[0].split('/').filter(Boolean);
          const psIndex = hashPathSegs.findIndex(s => s.toLowerCase().includes('purchase') && s.toLowerCase().includes('success'));
          if (psIndex >= 0 && hashPathSegs[psIndex + 1]) {
            const segRef = decodeURIComponent(hashPathSegs[psIndex + 1]);
            if (segRef) {
              try { console.debug('Found tx_ref in hash path segment:', segRef); } catch (_) {}
              return segRef;
            }
          }
        }

        // Try pathname '/purchase-success/:tx_ref'
        const path = window.location.pathname || '';
        if (path) {
          const pathSegs = path.split('/').filter(Boolean);
          const psIndex = pathSegs.findIndex(s => s.toLowerCase().includes('purchase') && s.toLowerCase().includes('success'));
          if (psIndex >= 0 && pathSegs[psIndex + 1]) {
            const segRef = decodeURIComponent(pathSegs[psIndex + 1]);
            if (segRef) {
              try { console.debug('Found tx_ref in pathname segment:', segRef); } catch (_) {}
              return segRef;
            }
          }
        }

        // Fallback to last known value from when we initiated the payment
        const stored = localStorage.getItem('last_tx_ref');
        if (stored) {
          try { console.debug('Using stored last_tx_ref:', stored); } catch (_) {}
          return stored;
        }
        return null;
      };

      const tx_ref = getTxRef();

      // If we can't find tx_ref but we do have an explicit success status from the provider, optimistically show success
      const searchParams = new URLSearchParams(window.location.search || '');
      const hashStr = (window.location.hash || '').replace(/^#\/?/, '');
      const hashParams = new URLSearchParams(hashStr.includes('?') ? hashStr.split('?')[1] : hashStr);
      const statusParam = (searchParams.get('status') || hashParams.get('status') || '').toLowerCase();
      if (!tx_ref && (statusParam === 'success' || statusParam === 'successful')) {
        setVerificationStatus('success');
        console.warn('No tx_ref found but status indicates success. Showing success optimistically.');
        return;
      }

      if (!tx_ref) {
        setVerificationStatus('failed');
        console.error('No transaction reference found in URL. Href:', window.location.href, 'Hash:', window.location.hash, 'Search:', window.location.search);
        return;
      }

      try {
        // The webhook might take a moment to process. We'll try verifying a few times.
        for (let i = 0; i < 3; i++) {
          const params = new URLSearchParams({ tx_ref, trx_ref: tx_ref, reference: tx_ref });
          const response = await api.get(`/verify-payment/?${params.toString()}`);
          // Check for a successful status from our backend's verification response
          if (response.data?.status === 'success') {
            setVerificationStatus('success');
            // Clear stored reference once verified
            try { localStorage.removeItem('last_tx_ref'); } catch (_) {}
            return;
          }
          // Wait 1.5 seconds before retrying
          await new Promise(res => setTimeout(res, 1500));
        }
        setVerificationStatus('failed'); // Failed after retries
      } catch (error) {
        console.error('Payment verification failed:', error);
        setVerificationStatus('failed');
      }
    };

    verifyPayment();
  }, []);

  const renderContent = () => {
    switch (verificationStatus) {
      case 'verifying':
        return (
          <>
            <FiLoader className="text-primary text-6xl mx-auto mb-4 animate-spin" />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Verifying Payment...</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Please wait while we confirm your transaction. This may take a moment.
            </p>
          </>
        );
      case 'success':
        return (
          <>
            <FiCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Payment Successful!</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Welcome to ShebaLove Premium! You now have access to all exclusive features.
            </p>
            <button
              onClick={() => onNavigate('home')}
              className="w-full flex items-center justify-center gap-3 bg-primary text-white px-6 py-4 rounded-lg shadow-md hover:bg-fuchsia-700 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-100"
            >
              <FiHome />
              <span>Go to Home</span>
            </button>
          </>
        );
      case 'failed':
        return (
          <>
            <FiXCircle className="text-red-500 text-6xl mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Verification Failed</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              We could not confirm your payment. Your account has not been charged. If you believe this is an error, please contact support.
            </p>
            <button
              onClick={() => onNavigate('home')}
              className="w-full flex items-center justify-center gap-3 bg-gray-600 text-white px-6 py-4 rounded-lg shadow-md hover:bg-gray-700 transition-all"
            >
              <FiHome />
              <span>Back to Home</span>
            </button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg text-center">
        {renderContent()}
      </div>
    </div>
  );
}
