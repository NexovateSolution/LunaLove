import React from "react";

const gifts = [
  { id: 1, name: "Rose", icon: "🌹", price: 10 },
  { id: 2, name: "Diamond", icon: "💎", price: 100 },
  { id: 3, name: "Coffee", icon: "☕", price: 5 },
  { id: 4, name: "Heart", icon: "❤️", price: 20 },
];

export default function GiftStore({ onClose, onSend }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-80">
        <h2 className="text-xl font-bold mb-4 text-fuchsia-600">Send a Gift</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {gifts.map(gift => (
            <button
              key={gift.id}
              className="flex flex-col items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900 transition"
              onClick={() => onSend(gift)}
            >
              <span className="text-3xl">{gift.icon}</span>
              <span className="font-semibold mt-1">{gift.name}</span>
              <span className="text-xs text-fuchsia-500 mt-1">{gift.price} coins</span>
            </button>
          ))}
        </div>
        <button className="w-full py-2 rounded bg-fuchsia-500 text-white font-semibold" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}