import React, { useEffect, useMemo, useState } from 'react'
import { AdminAPI } from '../api'

export default function AdminWithdrawals({ onToast }) {
  const [status, setStatus] = useState('PENDING')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await AdminAPI.listWithdrawals(status)
      setItems(data)
      setError('')
    } catch (e) {
      setError(e.message || 'Failed to load withdrawals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const approve = async (id) => {
    try {
      await AdminAPI.approveWithdrawal(id)
      onToast?.({ event: 'withdrawal.approved', id })
      fetchData()
    } catch (e) {
      onToast?.({ event: 'error', message: e.message || 'Approval failed' })
    }
  }

  const reject = async (id) => {
    const reason = window.prompt('Enter rejection reason:', 'Insufficient verification')
    if (reason === null) return
    try {
      await AdminAPI.rejectWithdrawal(id, reason)
      onToast?.({ event: 'withdrawal.rejected', id, reason })
      fetchData()
    } catch (e) {
      onToast?.({ event: 'error', message: e.message || 'Rejection failed' })
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-3">Admin • Withdrawals</h2>

      <div className="mb-3 flex items-center gap-2">
        <label className="text-sm text-gray-600">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded p-2 text-sm">
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="PAID">Paid</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button onClick={fetchData} className="ml-2 text-sm px-3 py-2 rounded bg-gray-100 border">Refresh</button>
      </div>

      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

      <div className="overflow-x-auto border rounded bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">ID</th>
              <th className="text-left px-3 py-2">User</th>
              <th className="text-left px-3 py-2">Method</th>
              <th className="text-left px-3 py-2">Destination</th>
              <th className="text-left px-3 py-2">Amount (ETB)</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Created</th>
              <th className="text-left px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-3 py-4 text-center text-gray-500">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-4 text-center text-gray-500">No records</td></tr>
            ) : (
              items.map((w) => (
                <tr key={w.id} className="border-t">
                  <td className="px-3 py-2">{w.id}</td>
                  <td className="px-3 py-2">{w.user}</td>
                  <td className="px-3 py-2">{w.method}</td>
                  <td className="px-3 py-2">{w.destination}</td>
                  <td className="px-3 py-2">{w.amount_etb}</td>
                  <td className="px-3 py-2">{w.status}</td>
                  <td className="px-3 py-2">{new Date(w.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    {w.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button onClick={() => approve(w.id)} className="px-3 py-1 rounded bg-green-600 text-white">Approve</button>
                        <button onClick={() => reject(w.id)} className="px-3 py-1 rounded bg-red-600 text-white">Reject</button>
                      </div>
                    )}
                    {w.status === 'APPROVED' && (
                      <span className="text-xs text-gray-500">Approved</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
