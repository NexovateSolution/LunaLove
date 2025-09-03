import React, { useEffect, useState } from 'react'
import Modal from './Modal'
import { PaymentsAPI } from '../api'

export default function GiftCatalogModal({ open, onClose, recipientId, onSent, wallet }) {
  const [loading, setLoading] = useState(false)
  const [gifts, setGifts] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    PaymentsAPI.listGifts()
      .then(setGifts)
      .catch((e) => setError(e.message || 'Failed to load gifts'))
  }, [open])

  const canAfford = (gift) => (wallet?.coin_balance || 0) >= gift.coins

  const sendGift = async (giftId) => {
    try {
      setLoading(true)
      await PaymentsAPI.sendGift({ recipient_id: Number(recipientId), gift_id: Number(giftId) })
      onSent?.()
      onClose?.()
    } catch (e) {
      setError(e.message || 'Failed to send gift')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Send a Gift">
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <div className="mb-3 text-sm text-gray-600">
        <div>Your Coins: <span className="font-semibold">{wallet?.coin_balance ?? 0}</span></div>
        <div className="mt-1 text-xs">Platform takes 25% (incl VAT); creator receives 75%.</div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {gifts.map((g) => (
          <button
            key={g.id}
            disabled={!canAfford(g) || loading}
            onClick={() => sendGift(g.id)}
            className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center ${
              canAfford(g) ? 'bg-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            <div className="text-3xl">💝</div>
            <div className="mt-1 text-xs font-medium">{g.name}</div>
            <div className="mt-0.5 text-[11px] text-gray-500">{g.coins} coins</div>
            <div className="mt-0.5 text-[11px] text-gray-500">~ {g.value_etb} ETB</div>
          </button>
        ))}
      </div>
      <div className="mt-4 text-sm">
        {!gifts.length && <div className="text-gray-500">No gifts yet.</div>}
        {wallet && wallet.coin_balance < Math.min(...gifts.map((x) => x.coins || 999999), 999999) && (
          <a href="#/topup" className="inline-block mt-3 text-pink-600 underline">Top-Up Coins</a>
        )}
      </div>
    </Modal>
  )
}
