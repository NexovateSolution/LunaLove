import React, { useEffect, useState } from 'react'

export default function Toast({ event }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3500)
    return () => clearTimeout(t)
  }, [])
  if (!visible) return null
  return (
    <div className="px-3 py-2 bg-gray-900 text-white/90 rounded shadow text-sm">
      <div className="font-medium">{event.event || 'Notification'}</div>
      <div className="text-xs text-white/80 break-all">{JSON.stringify(event)}</div>
    </div>
  )
}
