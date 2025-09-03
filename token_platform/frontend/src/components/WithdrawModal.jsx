import React, { useEffect, useState } from 'react'
import Modal from './Modal'
import { PaymentsAPI } from '../api'

const METHODS = [
  { value: 'CHAPA', label: 'Chapa' },
  { value: 'TELEBIRR', label: 'Telebirr' },
]

export default function WithdrawModal({ open, onClose, wallet, onRequested }) {
  const [method, setMethod] = useState('CHAPA')
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) setError('')
  }, [open])

  const validate = () => {
    if (!method) return 'Select a method'
    if (!destination.trim()) return 'Destination is required'
    const a = Number(amount)
    if (!a || a <= 0) return 'Enter a valid amount'
    if (wallet?.balance_etb && a > Number(wallet.balance_etb)) return 'Amount exceeds balance'
    return ''
  }

  const submit = async () => {
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    try {
      setLoading(true)
      await PaymentsAPI.requestWithdraw({ method, destination, amount_etb: amount })
      onRequested?.()
      onClose?.()
    } catch (e) {
      setError(e.message || 'Failed to request withdrawal')
    } finally {
      setLoading(false)
    }
  }

  if (wallet?.kyc_level < 2) {
    return (
      <Modal open={open} onClose={onClose} title="Withdraw">
        <div className="text-sm text-gray-700">
          Your KYC level is {wallet.kyc_level}. Please complete KYC to withdraw.
        </div>
        <a href="#/wallet" className="mt-3 inline-block text-pink-600 underline">Go to Wallet</a>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Withdraw">
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <div className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full border rounded p-2">
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Destination</label>
          <input value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full border rounded p-2" placeholder="Account / Phone / Ref" />
        </div>
        <div>
          <label className="block text-sm mb-1">Amount (ETB)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.01" className="w-full border rounded p-2" placeholder="0.00" />
        </div>
        <button onClick={submit} disabled={loading} className="w-full bg-pink-600 text-white rounded p-2 font-medium">
          {loading ? 'Submitting...' : 'Withdraw'}
        </button>
      </div>
    </Modal>
  )
}
