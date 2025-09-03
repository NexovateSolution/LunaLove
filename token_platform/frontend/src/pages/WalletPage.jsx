import React, { useEffect, useState } from 'react'
import { PaymentsAPI } from '../api'
import WithdrawModal from '../components/WithdrawModal'

export default function WalletPage({ onToast, wsEvent }) {
  const [wallet, setWallet] = useState(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  const refresh = () => PaymentsAPI.wallet().then(setWallet).catch((e) => setError(e.message || 'Failed to load'))

  useEffect(() => { refresh() }, [])

  // Refresh on realtime wallet update
  useEffect(() => {
    if (wsEvent?.event === 'wallet.updated') {
      refresh()
    }
  }, [wsEvent])

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-3">Wallet</h2>
      {error && <div className="mb-2 text-sm text-red-600">{error}</div>}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded border bg-white">
          <div className="text-xs text-gray-500">Coin Balance</div>
          <div className="text-lg font-semibold">{wallet?.coin_balance ?? 0}</div>
        </div>
        <div className="p-3 rounded border bg-white">
          <div className="text-xs text-gray-500">Earnings (ETB)</div>
          <div className="text-lg font-semibold">{wallet?.balance_etb ?? '0.00'}</div>
        </div>
      </div>
      <button onClick={() => setOpen(true)} className="mt-4 w-full bg-pink-600 text-white rounded p-2 font-medium">
        Withdraw
      </button>

      <h3 className="mt-6 mb-2 text-sm font-semibold">Recent Gifts</h3>
      <div className="space-y-2">
        {(wallet?.recent_gifts || []).map((g) => (
          <div key={g.tx_id} className="p-3 rounded border bg-white text-sm flex items-center justify-between">
            <div>
              <div className="font-medium">{g.gift}</div>
              <div className="text-xs text-gray-600">{g.coins} coins • {g.valueETB} ETB</div>
            </div>
            <div className="text-xs text-gray-600">{new Date(g.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <WithdrawModal
        open={open}
        onClose={() => setOpen(false)}
        wallet={wallet}
        onRequested={() => {
          onToast?.({ event: 'withdrawal.requested' })
          refresh()
        }}
      />
    </div>
  )
}
