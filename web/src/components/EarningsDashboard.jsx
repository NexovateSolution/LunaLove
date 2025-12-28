import React, { useState, useEffect } from 'react';
import { 
  FiDollarSign, FiArrowLeft, FiCheck, FiAlertCircle, 
  FiGift, FiTrendingUp, FiCreditCard, FiChevronRight,
  FiLoader
} from 'react-icons/fi';

const EarningsDashboard = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [subaccountStatus, setSubaccountStatus] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [banks, setBanks] = useState([]);
  const [setupForm, setSetupForm] = useState({
    bank_code: '',
    account_number: '',
    account_name: ''
  });
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState(null);
  const [showChangeAccount, setShowChangeAccount] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchSubaccountStatus();
    fetchBanks();
  }, []);

  const fetchSubaccountStatus = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8000/api/subaccount/status/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      const data = await response.json();
      setSubaccountStatus(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching subaccount status:', error);
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8000/api/banks/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      const data = await response.json();
      setBanks(data.data || []);
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch('http://localhost:8000/api/subaccount/delete/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success! Refresh status to show setup form
        await fetchSubaccountStatus();
        setShowChangeAccount(false);
        setShowSetup(true);
      } else {
        alert(data.error || data.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting subaccount:', error);
      alert('Network error. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setSetupLoading(true);
    setSetupError(null);

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8000/api/subaccount/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(setupForm)
      });

      const data = await response.json();
      
      console.log('Subaccount creation response:', data);

      if (response.ok && data.success) {
        // Success! Refresh status
        await fetchSubaccountStatus();
        setShowSetup(false);
        setSetupForm({ bank_code: '', account_number: '', account_name: '' });
      } else {
        // Get detailed error message from Chapa
        let errorMsg = data.error || data.message || data.detail || 'Failed to create subaccount';
        
        // If there's a details object with a message, use that
        if (data.details && data.details.message) {
          errorMsg = data.details.message;
        }
        
        console.error('Subaccount creation failed:', data);
        setSetupError(errorMsg);
      }
    } catch (error) {
      console.error('Error creating subaccount:', error);
      setSetupError('Network error. Please try again.');
    } finally {
      setSetupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <FiLoader className="text-4xl text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => onNavigate && onNavigate('settings')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <FiArrowLeft /> Back to Settings
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
              <FiDollarSign className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Earnings Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your gift earnings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!subaccountStatus?.has_subaccount ? (
          /* No Subaccount - Setup Flow */
          <div className="space-y-6">
            {!showSetup ? (
              /* Introduction */
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiGift className="text-white text-3xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Start Earning from Gifts!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Set up your bank account to receive 70% of gift values
                  </p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">How it works:</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">1</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Someone sends you a gift</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Worth 100 ETB</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">2</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">You earn 70 ETB</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">70% goes to your bank account</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">3</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Automatic settlement</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Money sent to your bank</div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowSetup(true)}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Set Up Bank Account
                </button>
              </div>
            ) : (
              /* Bank Account Setup Form */
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Connect Your Bank Account
                </h2>

                {setupError && (
                  <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                    setupError.includes('successfully') || setupError.includes('success')
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}>
                    {setupError.includes('successfully') || setupError.includes('success') ? (
                      <FiCheck className="text-green-600 dark:text-green-400 text-xl flex-shrink-0 mt-0.5" />
                    ) : (
                      <FiAlertCircle className="text-red-600 dark:text-red-400 text-xl flex-shrink-0 mt-0.5" />
                    )}
                    <div className={setupError.includes('successfully') || setupError.includes('success')
                      ? 'text-green-600 dark:text-green-400 text-sm'
                      : 'text-red-600 dark:text-red-400 text-sm'
                    }>
                      {setupError}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSetupSubmit} className="space-y-6">
                  {/* Bank Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Your Bank
                    </label>
                    <select
                      value={setupForm.bank_code}
                      onChange={(e) => setSetupForm({ ...setupForm, bank_code: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Choose a bank...</option>
                      {banks.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={setupForm.account_number}
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/\D/g, '');
                        setSetupForm({ ...setupForm, account_number: value });
                      }}
                      placeholder="1000123456789"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      minLength="10"
                      maxLength="20"
                    />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      💡 Enter your full bank account number (usually 13-16 digits for Ethiopian banks)
                    </p>
                  </div>

                  {/* Account Holder Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={setupForm.account_name}
                      onChange={(e) => setSetupForm({ ...setupForm, account_name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      ⚠️ Make sure this matches your bank account exactly
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSetup(false);
                        setSetupError(null);
                      }}
                      className="flex-1 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                      disabled={setupLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      disabled={setupLoading}
                    >
                      {setupLoading ? (
                        <>
                          <FiLoader className="animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* Has Subaccount - Dashboard */
          <div className="space-y-6">
            {/* Earnings Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <FiTrendingUp className="text-green-500 text-xl" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Earned</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {subaccountStatus.total_earnings} ETB
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <FiDollarSign className="text-blue-500 text-xl" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Available</span>
                </div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {subaccountStatus.available_balance} ETB
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <FiCheck className="text-purple-500 text-xl" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Withdrawn</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {subaccountStatus.total_withdrawn} ETB
                </div>
              </div>
            </div>

            {/* Bank Account Info */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiCreditCard className="text-green-500" />
                  Connected Bank Account
                </h3>
                <button
                  onClick={() => setShowChangeAccount(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Change Account
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-2xl">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{subaccountStatus.bank_name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Account: {subaccountStatus.account_number}</div>
                  {subaccountStatus.is_verified && (
                    <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                      <FiCheck className="text-xs" />
                      Verified
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  🔒 For security reasons, bank account changes require verification. Contact support to update your account details.
                </p>
              </div>
            </div>

            {/* How Earnings Work */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-3xl p-6 border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FiGift className="text-green-600 dark:text-green-400" />
                How Your Earnings Work
              </h3>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <p>• You receive <strong>70%</strong> of every gift's value</p>
                <p>• Earnings are automatically sent to your bank account</p>
                <p>• Settlement happens based on Chapa's schedule</p>
                <p>• Track all your earnings here in real-time</p>
              </div>
            </div>

            {/* Recent Earnings - Placeholder */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Earnings</h3>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FiGift className="text-4xl mx-auto mb-2 opacity-50" />
                <p>No earnings yet</p>
                <p className="text-sm mt-1">Start receiving gifts to see your earnings here!</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Account Confirmation Modal */}
      {showChangeAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Change Bank Account?
            </h3>
            
            <div className="mb-6 space-y-3">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ <strong>Warning:</strong> This will remove your current bank account.
                </p>
              </div>
              
              {subaccountStatus?.available_balance > 0 ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    ❌ You have <strong>{subaccountStatus.available_balance} ETB</strong> in pending earnings.
                    You cannot change accounts until your earnings are settled.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    After removing your current account, you'll be able to add a new one immediately.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowChangeAccount(false)}
                className="flex-1 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to remove your current bank account? This action cannot be undone.')) {
                    handleDeleteAccount();
                  }
                }}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={deleteLoading || (subaccountStatus?.available_balance > 0)}
              >
                {deleteLoading ? (
                  <>
                    <FiLoader className="animate-spin" />
                    Removing...
                  </>
                ) : (
                  'Remove Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarningsDashboard;
