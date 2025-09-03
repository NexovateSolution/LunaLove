import React from 'react'

export default function GiftButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-5 right-5 rounded-full shadow-lg bg-pink-600 text-white w-14 h-14 flex items-center justify-center text-2xl focus:outline-none focus:ring-2 focus:ring-pink-400"
      aria-label="Send Gift"
      title="Send Gift"
    >
      🎁
    </button>
  )
}
