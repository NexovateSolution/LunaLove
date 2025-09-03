import React, { useEffect, useState } from 'react'
import { PaymentsAPI } from '../api'

export default function TopUpPage({ onToast }) {
  const [packages_, setPackages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    PaymentsAPI.listPackages().then(setPackages).catch((e) => setError(e.message || 'Failed to load'))
  }, [])

  const buy = async (pkg) => {
    try {
      setLoading(true)
      const res = await PaymentsAPI.createTopUp(pkg.id)
      onToast?.({ event: 'checkout.created', paymentId: res.payment?.id, provider: res.payment?.provider })
      if (res.checkout_url) window.location.href = res.checkout_url
    } catch (e) {
      setError(e.message || 'Failed to create checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-3">Top-Up Coins</h2>
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <div className="space-y-3">
        {packages_.map((p) => (
          <div key={p.id} className="rounded border bg-white p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-gray-600">Coins: {p.coins}</div>
              <div className="text-xs text-gray-600">VAT: {p.vat_etb} ETB</div>
            </div>
            <button
              onClick={() => buy(p)}
              disabled={loading}
              className="bg-pink-600 text-white rounded px-3 py-2 text-sm"
            >
              Buy {p.price_total_etb} ETB
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
