// Simple API helper wrapping fetch with JSON handling
export async function apiGet(path) {
  const res = await fetch(path, { credentials: 'include' })
  if (!res.ok) throw await asError(res)
  return res.json()
}

function getCookie(name) {
  const m = document.cookie.match('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)')
  return m ? decodeURIComponent(m[1]) : undefined
}

export async function apiPost(path, body) {
  const csrf = getCookie('csrftoken') || getCookie('CSRF-TOKEN') || getCookie('XSRF-TOKEN')
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(csrf ? { 'X-CSRFToken': csrf, 'X-CSRF-Token': csrf } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(body || {}),
  })
  if (!res.ok) throw await asError(res)
  return res.json()
}

async function asError(res) {
  let detail = `${res.status} ${res.statusText}`
  try {
    const data = await res.json()
    detail = data.detail || JSON.stringify(data)
  } catch (_) {}
  const err = new Error(detail)
  err.status = res.status
  return err
}

export const PaymentsAPI = {
  listGifts: () => apiGet('/api/gifts/'),
  sendGift: ({ recipient_id, gift_id }) => apiPost('/api/gifts/send/', { recipient_id, gift_id }),
  wallet: () => apiGet('/api/wallet/'),
  listPackages: () => apiGet('/api/coins/packages/'),
  createTopUp: (package_id) => apiPost('/api/coins/topup/', { package_id }),
  requestWithdraw: ({ method, destination, amount_etb }) => apiPost('/api/wallet/withdraw/', { method, destination, amount_etb }),
}

export const AdminAPI = {
  listWithdrawals: (status) => apiGet(`/api/admin/withdrawals/${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  approveWithdrawal: (id) => apiPost(`/api/admin/withdrawals/${id}/approve`, {}),
  rejectWithdrawal: (id, reason) => apiPost(`/api/admin/withdrawals/${id}/reject`, { reason }),
}
