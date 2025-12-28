import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiDollarSign, FiFileText, FiDownload, FiPrinter, FiArrowLeft, FiExternalLink } from 'react-icons/fi';

export default function CoinPurchaseReceipt({ onBack }) {
  const [purchaseData, setPurchaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get purchase data from URL params (both search and hash) or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    
    // Parse hash parameters if they exist
    let hashParams = new URLSearchParams();
    if (hash.includes('?')) {
      const hashQuery = hash.split('?')[1];
      hashParams = new URLSearchParams(hashQuery);
    }
    
    const purchaseId = urlParams.get('purchase_id') || hashParams.get('purchase_id') || localStorage.getItem('last_coin_ref');
    const chapaRef = urlParams.get('chapa_ref') || hashParams.get('chapa_ref') || urlParams.get('reference') || hashParams.get('reference');
    const status = urlParams.get('status') || hashParams.get('status');

    // Debug logging
    console.log('Receipt page - URL params:', {
      purchaseId,
      chapaRef,
      status,
      fullUrl: window.location.href,
      search: window.location.search,
      hash: window.location.hash,
      hashParams: Object.fromEntries(hashParams.entries()),
      urlParams: Object.fromEntries(urlParams.entries())
    });

    if (purchaseId || chapaRef) {
      fetchPurchaseDetails(purchaseId, chapaRef, status);
    } else {
      setError('No purchase information found');
      setLoading(false);
    }
  }, []);

  const fetchPurchaseDetails = async (purchaseId, chapaRef, status) => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (purchaseId) params.append('purchase_id', purchaseId);
      if (chapaRef) params.append('chapa_ref', chapaRef);
      if (status) params.append('status', status);
      
      const response = await fetch(`/api/coins/purchase-status/?${params.toString()}`, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPurchaseData(data);
        
        // Clear the stored reference
        localStorage.removeItem('last_coin_ref');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to fetch purchase details');
      }
    } catch (error) {
      console.error('Error fetching purchase details:', error);
      setError('Failed to load purchase information');
    } finally {
      setLoading(false);
    }
  };

  const openChapaReceipt = () => {
    if (purchaseData?.chapa_reference) {
      const receiptUrl = `https://chapa.link/payment-receipt/${purchaseData.chapa_reference}`;
      window.open(receiptUrl, '_blank');
    }
  };

  const printReceipt = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading purchase details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto p-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-white/80 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isSuccess = purchaseData?.status === 'completed' || purchaseData?.status === 'success';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 px-4 py-4 print:hidden">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <FiArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Purchase Receipt</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={printReceipt}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Print Receipt"
            >
              <FiPrinter size={20} />
            </button>
            {purchaseData?.chapa_reference && (
              <button
                onClick={openChapaReceipt}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="View Official Receipt"
              >
                <FiExternalLink size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Status Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
          {isSuccess ? (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4">
                <FiCheckCircle size={40} className="text-green-400" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Payment Successful!</h2>
              <p className="text-white/80 text-lg">
                Your coins have been added to your wallet
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 rounded-full mb-4">
                <span className="text-4xl">❌</span>
              </div>
              <h2 className="text-3xl font-bold mb-2">Payment Failed</h2>
              <p className="text-white/80 text-lg">
                Your payment could not be processed
              </p>
            </>
          )}
        </div>

        {/* Purchase Details */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <FiFileText size={24} className="text-blue-400" />
            <h3 className="text-xl font-bold">Purchase Details</h3>
          </div>

          <div className="space-y-4">
            {/* Transaction ID */}
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-white/70">Transaction ID</span>
              <span className="font-mono text-sm bg-white/10 px-2 py-1 rounded">
                {purchaseData?.chapa_reference || purchaseData?.transaction_id || 'N/A'}
              </span>
            </div>

            {/* Package Details */}
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-white/70">Package</span>
              <span className="font-semibold">{purchaseData?.package_name || 'Coin Package'}</span>
            </div>

            {/* Coins */}
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-white/70">Coins Purchased</span>
              <div className="flex items-center gap-2">
                <FiDollarSign className="text-yellow-400" />
                <span className="font-bold text-yellow-400">
                  {purchaseData?.coins_purchased || 0}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-white/70">Amount Paid</span>
              <span className="font-bold text-green-400">
                {purchaseData?.amount_etb || 0} ETB
              </span>
            </div>

            {/* Payment Method */}
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-white/70">Payment Method</span>
              <span className="capitalize">{purchaseData?.payment_method || 'Chapa'}</span>
            </div>

            {/* Date */}
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-white/70">Date & Time</span>
              <span>
                {purchaseData?.created_at 
                  ? new Date(purchaseData.created_at).toLocaleString()
                  : new Date().toLocaleString()
                }
              </span>
            </div>

            {/* Status */}
            <div className="flex justify-between items-center py-2">
              <span className="text-white/70">Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isSuccess 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {isSuccess ? 'Completed' : 'Failed'}
              </span>
            </div>
          </div>
        </div>

        {/* Current Wallet Balance */}
        {isSuccess && purchaseData?.new_balance !== undefined && (
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/30">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Updated Wallet Balance</h3>
              <div className="text-3xl font-bold text-yellow-400 flex items-center justify-center gap-2">
                <FiDollarSign />
                {purchaseData.new_balance} coins
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 print:hidden">
          {purchaseData?.chapa_reference && (
            <button
              onClick={openChapaReceipt}
              className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <FiExternalLink size={16} />
              View Official Receipt
            </button>
          )}
          
          <button
            onClick={printReceipt}
            className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <FiPrinter size={16} />
            Print Receipt
          </button>
        </div>

        {/* Footer Info */}
        <div className="text-center text-white/60 text-sm space-y-2 print:hidden">
          <p>Thank you for your purchase!</p>
          <p>For support, contact us at support@lunalove.com</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .bg-gradient-to-br {
            background: white !important;
          }
          .text-white {
            color: black !important;
          }
          .bg-white\\/10 {
            background: #f5f5f5 !important;
            border: 1px solid #ddd !important;
          }
        }
      `}</style>
    </div>
  );
}
