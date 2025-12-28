import React, { useEffect, useState } from "react";
import { getGifts } from "../api";

export default function GiftStore({ onClose, onSend }) {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getGifts();
        if (!mounted) return;
        // Backend gift shape: { id, name, coin_cost, etb_value, icon }
        const mapped = (data || []).map((g, i) => ({
          id: g.id,
          name: g.name,
          coins: Number(g.coin_cost) || 0,
          value_etb: g.etb_value,
          icon: g.icon || deriveIcon(g.name, i),
        }));
        setGifts(mapped);
      } catch (e) {
        if (!mounted) return;
        setError("Failed to load gifts. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const deriveIcon = (name, index) => {
    const icons = ["🌹", "💎", "🎁", "❤️", "🌟", "🎉", "💝", "🏆"];
    if (name?.toLowerCase().includes("rose")) return "🌹";
    if (name?.toLowerCase().includes("diamond")) return "💎";
    if (name?.toLowerCase().includes("heart")) return "❤️";
    if (name?.toLowerCase().includes("star")) return "🌟";
    return icons[index % icons.length];
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading gifts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Send a Gift</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {gifts.map((gift) => (
            <button
              key={gift.id}
              onClick={() => onSend && onSend(gift)}
              className="bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200 rounded-lg p-4 text-center transition-all duration-200 hover:scale-105"
            >
              <div className="text-3xl mb-2">{gift.icon}</div>
              <div className="font-semibold text-gray-800 text-sm">{gift.name}</div>
              <div className="text-purple-600 text-xs font-medium">
                {gift.coins} coins
              </div>
              <div className="text-green-600 text-xs">
                {gift.value_etb} ETB
              </div>
            </button>
          ))}
        </div>

        {gifts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No gifts available</p>
          </div>
        )}
      </div>
    </div>
  );
}