import React, { useEffect, useMemo, useState } from 'react'
import useNotificationsWS from './useNotificationsWS'
import Toast from './components/Toast'
import ProfilePage from './pages/ProfilePage'
import TopUpPage from './pages/TopUpPage'
import WalletPage from './pages/WalletPage'
import CheckoutPage from './pages/CheckoutPage'
import AdminWithdrawals from './pages/AdminWithdrawals'
import { AdminAPI } from './api'

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || '#/')
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

function parseRoute(hash) {
  const path = hash.replace(/^#/, '') || '/'
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 0) return { name: 'home', params: {} }
  if (parts[0] === '') return { name: 'home', params: {} }
  if (parts[0] === 'profile') return { name: 'profile', params: { id: parts[1] || '' } }
  if (parts[0] === 'topup') return { name: 'topup', params: {} }
  if (parts[0] === 'wallet') return { name: 'wallet', params: {} }
  if (parts[0] === 'admin' && parts[1] === 'withdrawals') return { name: 'admin_withdrawals', params: {} }
  return { name: 'home', params: {} }
}

export default function App() {
  // Dev-only: read current user id for WS token from localStorage or query (?uid=)
  const urlUid = useMemo(() => new URLSearchParams(window.location.search).get('uid'), [])
  const [currentUserId, setCurrentUserId] = useState(
    Number(urlUid || localStorage.getItem('uid') || '') || ''
  )
  useEffect(() => {
    if (currentUserId) localStorage.setItem('uid', String(currentUserId))
  }, [currentUserId])

  const [toasts, setToasts] = useState([])
  const pushToast = (evt) => setToasts((t) => [...t, { id: Date.now() + Math.random(), evt }])
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id))

  const hash = useHashRoute()
  const route = parseRoute(hash)

  const { lastEvent } = useNotificationsWS(currentUserId, (evt) => {
    // Show relevant events
    if (evt?.event) pushToast(evt)
  })

  // Admin login state banner
  const [adminState, setAdminState] = useState('checking') // 'checking' | 'yes' | 'no'
  async function checkAdmin() {
    try {
      await AdminAPI.listWithdrawals()
      setAdminState('yes')
    } catch (_) {
      setAdminState('no')
    }
  }
  useEffect(() => {
    checkAdmin()
    const id = setInterval(checkAdmin, 60_000)
    return () => clearInterval(id)
  }, [])

  // Auto-clean toasts
  useEffect(() => {
    if (!toasts.length) return
    const timers = toasts.map((t) => setTimeout(() => removeToast(t.id), 3800))
    return () => timers.forEach(clearTimeout)
  }, [toasts])

  // If backend sends users to /purchase/checkout (non-hash), render a lightweight page
  if (window.location.pathname === '/purchase/checkout') {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <main className="max-w-md mx-auto">
          <CheckoutPage />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <a href="#/" className="text-lg font-semibold">Token Platform</a>
            <nav className="text-sm space-x-3 flex items-center">
              <a href="#/wallet" className="text-pink-600">Wallet</a>
              <a href="#/topup" className="text-pink-600">Top-Up</a>
              <a href="#/admin/withdrawals" className="text-pink-600">Admin</a>
            </nav>
          </div>
          <div className="mt-2">
            {adminState === 'checking' && (
              <div className="text-xs text-gray-500">Checking admin status…</div>
            )}
            {adminState === 'yes' && (
              <div className="text-xs px-2 py-1 inline-block rounded bg-green-100 text-green-700 border border-green-200">
                Admin: Logged in • <a href="/admin/" className="underline">Open Django Admin</a>
              </div>
            )}
            {adminState === 'no' && (
              <div className="text-xs px-2 py-1 inline-block rounded bg-yellow-100 text-yellow-800 border border-yellow-200">
                Admin: Not logged in • <a href="/admin/" className="underline">Log in</a>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        {route.name === 'home' && (
          <div className="p-4">
            <div className="rounded-xl bg-white border p-4">
              <div className="text-sm text-gray-600">Enter your User ID (dev) for WebSocket notifications</div>
              <input
                value={currentUserId}
                onChange={(e) => setCurrentUserId(e.target.value.replace(/[^0-9]/g, ''))}
                className="mt-2 w-full border rounded p-2"
                placeholder="e.g. 1"
              />
              <div className="mt-3 text-sm">
                Try visiting a profile: <a href="#/profile/2" className="text-pink-600 underline">#/profile/2</a>
              </div>
            </div>
          </div>
        )}

        {route.name === 'profile' && (
          <ProfilePage
            currentUserId={Number(currentUserId) || undefined}
            profileUserId={Number(route.params.id) || 0}
            onToast={(evt) => pushToast(evt)}
            wsEvent={lastEvent}
          />
        )}
        {route.name === 'topup' && <TopUpPage onToast={(evt) => pushToast(evt)} />}
        {route.name === 'wallet' && <WalletPage onToast={(evt) => pushToast(evt)} wsEvent={lastEvent} />}
        {route.name === 'admin_withdrawals' && <AdminWithdrawals onToast={(evt) => pushToast(evt)} />}
      </main>

      {/* Toasts */}
      <div className="fixed bottom-4 left-0 right-0 flex flex-col items-center space-y-2 z-50">
        {toasts.map((t) => (
          <Toast key={t.id} event={t.evt} />
        ))}
      </div>
    </div>
  )
}
