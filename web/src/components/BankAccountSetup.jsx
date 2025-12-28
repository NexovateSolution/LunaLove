import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiCheck, FiAlertCircle } from 'react-icons/fi';

export default function BankAccountSetup({ onBack, onComplete }) {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bank_code: '',
    account_number: '',
    account_name: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const response = await fetch('/api/banks/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBanks(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/subaccount/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          onComplete(data.subaccount);
        }
      } else {
        const errorData = await response.json();
        if (errorData.error) {
          setErrors({ general: errorData.error });
        }
      }
    } catch (error) {
      console.error('Error creating subaccount:', error);
      setErrors({ general: 'Failed to create account. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
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
          <h1 className="text-xl font-bold">Bank Account Setup</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Info Card */}
        <div className="bg-blue-500/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-500/30 mb-6">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-blue-400 mt-1" size={20} />
            <div>
              <h3 className="font-semibold mb-1">Why do we need this?</h3>
              <p className="text-sm text-white/80">
                Set up your bank account to receive money when other users send you gifts. 
                You'll earn 70% of each gift's value directly to your bank account!
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bank Selection */}
          <div>
            <label className="block text-white font-medium mb-2">Select Bank</label>
            <select
              value={formData.bank_code}
              onChange={(e) => handleChange('bank_code', e.target.value)}
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
              required
            >
              <option value="">Choose your bank</option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id} className="bg-slate-800">
                  {bank.name}
                </option>
              ))}
            </select>
            {errors.bank_code && (
              <p className="text-red-400 text-sm mt-1">{errors.bank_code}</p>
            )}
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-white font-medium mb-2">Account Number</label>
            <input
              type="text"
              value={formData.account_number}
              onChange={(e) => handleChange('account_number', e.target.value)}
              placeholder="Enter your account number"
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-purple-500 focus:outline-none"
              required
            />
            {errors.account_number && (
              <p className="text-red-400 text-sm mt-1">{errors.account_number}</p>
            )}
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-white font-medium mb-2">Account Holder Name</label>
            <input
              type="text"
              value={formData.account_name}
              onChange={(e) => handleChange('account_name', e.target.value)}
              placeholder="Enter account holder name"
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-purple-500 focus:outline-none"
              required
            />
            <p className="text-white/60 text-sm mt-1">
              Must match the name on your bank account exactly
            </p>
            {errors.account_name && (
              <p className="text-red-400 text-sm mt-1">{errors.account_name}</p>
            )}
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-200 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <FiCheck size={18} />
                Setup Account
              </>
            )}
          </button>
        </form>

        {/* Security Note */}
        <div className="mt-6 bg-green-500/20 backdrop-blur-sm rounded-2xl p-4 border border-green-500/30">
          <div className="flex items-start gap-3">
            <FiCheck className="text-green-400 mt-1" size={20} />
            <div>
              <h4 className="font-semibold mb-1">Secure & Safe</h4>
              <p className="text-sm text-white/80">
                Your bank details are encrypted and processed securely through Chapa's 
                banking infrastructure. We never store your sensitive information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
