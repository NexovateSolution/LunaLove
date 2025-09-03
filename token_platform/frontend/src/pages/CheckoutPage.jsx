import React from 'react'

export default function CheckoutPage() {
  const params = new URLSearchParams(window.location.search)
  const paymentId = params.get('payment_id')
  const ref = params.get('ref')
  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-2">Checkout</h2>
      <div className="rounded border bg-white p-4 text-sm">
        <div className="mb-2">Payment initiated. Complete the payment in the opened gateway tab/window if applicable.</div>
        <div className="text-gray-600">Payment ID: <span className="font-medium">{paymentId}</span></div>
        <div className="text-gray-600">Reference: <span className="font-medium break-all">{ref}</span></div>
        <div className="mt-3 text-xs text-gray-500">
          In development, payments are finalized via webhooks. Once processed, your coin balance will update in real-time.
        </div>
        <a href="#/topup" className="mt-4 inline-block text-pink-600 underline">Return to Top-Up</a>
      </div>
    </div>
  )
}
