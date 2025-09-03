import React from 'react'

export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-lg p-4 sm:p-6 animate-slide-up">
        {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
        <div className="max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </div>
  )
}
