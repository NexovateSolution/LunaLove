import React, { useEffect, useState } from 'react'
import GiftButton from '../components/GiftButton'
import GiftCatalogModal from '../components/GiftCatalogModal'
import { PaymentsAPI } from '../api'

export default function ProfilePage({ currentUserId, profileUserId, onToast, wsEvent }) {
  const [wallet, setWallet] = useState(null)
  const [open, setOpen] = useState(false)

  const refreshWallet = () => PaymentsAPI.wallet().then(setWallet).catch(() => {})

  useEffect(() => {
    refreshWallet()
  }, [])

  useEffect(() => {
    if (wsEvent?.event === 'wallet.updated') {
      refreshWallet()
    }
  }, [wsEvent])

  return (
    <div className="p-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="h-28 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500" />
        <div className="mt-3">
          <div className="text-xl font-semibold">Creator Profile #{profileUserId}</div>
          <div className="text-sm text-gray-600">Send them a gift to support.</div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded bg-white border">
            <div className="text-xs text-gray-500">Your Coins</div>
            <div className="text-lg font-semibold">{wallet?.coin_balance ?? 0}</div>
          </div>
          <div className="p-3 rounded bg-white border">
            <div className="text-xs text-gray-500">Earnings</div>
            <div className="text-lg font-semibold">{wallet?.balance_etb ?? '0.00'}</div>
          </div>
          <a href="#/topup" className="p-3 rounded bg-white border">
            <div className="text-xs text-gray-500">Top-Up</div>
            <div className="text-lg font-semibold">Coins</div>
          </a>
        </div>
      </div>

      <GiftButton onClick={() => setOpen(true)} />

      <GiftCatalogModal
        open={open}
        onClose={() => setOpen(false)}
        recipientId={profileUserId}
        wallet={wallet}
        onSent={() => {
          onToast?.({ event: 'gift.sent', to: profileUserId })
          refreshWallet()
        }}
      />
    </div>
  )
}
