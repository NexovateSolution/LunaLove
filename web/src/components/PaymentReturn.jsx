import React, { useEffect, useState } from 'react';
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaExclamationCircle } from 'react-icons/fa';

const PaymentReturn = ({ onNavigate }) => {
  const [status, setStatus] = useState('checking'); // checking, success, failed, cancelled
  const [message, setMessage] = useState('Verifying your payment...');
  const [details, setDetails] = useState(null);

  useEffect(() => {
    // Get URL parameters from hash
    const hash = window.location.hash;
    const queryString = hash.includes('?') ? hash.split('?')[1] : '';
    const params = new URLSearchParams(queryString);
    
    const txRef = params.get('tx_ref');
    const purchaseId = params.get('purchase_id');
    const chapaStatus = params.get('status'); // Chapa may add this

    // If Chapa explicitly says cancelled
    if (chapaStatus === 'cancelled' || chapaStatus === 'failed') {
      setStatus('cancelled');
      setMessage('Payment was cancelled');
      setTimeout(() => {
        if (onNavigate) onNavigate('purchase');
      }, 3000);
      return;
    }

    // Otherwise, verify the payment
    if (txRef) {
      verifyPayment(txRef);
    } else {
      setStatus('failed');
      setMessage('Invalid payment reference');
      setTimeout(() => {
        if (onNavigate) onNavigate('purchase');
      }, 3000);
    }
  }, [onNavigate]);

  const verifyPayment = async (txRef) => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch('http://localhost:8000/api/coins/verify-payment/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ tx_ref: txRef })
      });

      const data = await response.json();

      if (data.success && data.status === 'completed') {
        setStatus('success');
        setMessage('Payment successful!');
        setDetails({
          coins: data.coins_credited,
          balance: data.new_balance
        });
        setTimeout(() => {
          if (onNavigate) onNavigate('purchase');
        }, 3000);
      } else if (data.status === 'pending') {
        setStatus('pending');
        setMessage('Payment is being processed. Please wait...');
        // Retry after 3 seconds
        setTimeout(() => verifyPayment(txRef), 3000);
      } else {
        setStatus('failed');
        setMessage(data.message || 'Payment verification failed');
        setTimeout(() => {
          if (onNavigate) onNavigate('purchase');
        }, 3000);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('failed');
      setMessage('Failed to verify payment. Please contact support.');
      setTimeout(() => {
        if (onNavigate) onNavigate('purchase');
      }, 5000);
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'checking':
      case 'pending':
        return <FaSpinner className="w-16 h-16 text-blue-500 animate-spin" />;
      case 'success':
        return <FaCheckCircle className="w-16 h-16 text-green-500" />;
      case 'cancelled':
        return <FaExclamationCircle className="w-16 h-16 text-yellow-500" />;
      case 'failed':
        return <FaTimesCircle className="w-16 h-16 text-red-500" />;
      default:
        return <FaSpinner className="w-16 h-16 text-blue-500 animate-spin" />;
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-50';
      case 'cancelled':
        return 'bg-yellow-50';
      case 'failed':
        return 'bg-red-50';
      default:
        return 'bg-blue-50';
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${getBackgroundColor()}`}>
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            {getIcon()}
            
            <h2 className="text-2xl font-bold text-gray-900">
              {status === 'checking' && 'Verifying Payment'}
              {status === 'pending' && 'Processing Payment'}
              {status === 'success' && 'Payment Successful!'}
              {status === 'cancelled' && 'Payment Cancelled'}
              {status === 'failed' && 'Payment Failed'}
            </h2>
            
            <p className="text-gray-600">
              {message}
            </p>

            {details && status === 'success' && (
              <div className="w-full bg-green-50 rounded-lg p-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Coins Added:</span>
                  <span className="text-green-600 font-bold text-lg">
                    +{details.coins} 🪙
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">New Balance:</span>
                  <span className="text-gray-900 font-bold">
                    {details.balance} coins
                  </span>
                </div>
              </div>
            )}

            {status === 'cancelled' && (
              <button
                onClick={() => onNavigate && onNavigate('purchase')}
                className="mt-4 px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Try Again
              </button>
            )}

            {status === 'failed' && (
              <button
                onClick={() => onNavigate && onNavigate('purchase')}
                className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Back to Coins
              </button>
            )}

            {(status === 'checking' || status === 'pending' || status === 'success') && (
              <p className="text-sm text-gray-500 mt-4">
                Redirecting you back...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReturn;
