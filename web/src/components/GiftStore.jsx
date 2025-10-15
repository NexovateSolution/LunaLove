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
        // Backend gift shape: { id, name, coins, value_etb }
        // We’ll derive an icon for display when not provided
        const mapped = (data || []).map((g, i) => ({
          id: g.id,
          name: g.name,
          coins: Number(g.coins) || 0,
          value_etb: g.value_etb,
          icon: g.gift_icon || deriveIcon(g.name, i),
          animation: g.gift_animation_type || deriveAnimation(g.name),
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

  const handleSend = (gift) => {
    // Pass full gift object so caller can access gift.id for backend call
    if (onSend) onSend(gift);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-sm sm:max-w-md max-h-[80vh] p-4 sm:p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-3 text-fuchsia-600">Send a Gift</h2>
        {loading && <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Loading gifts...</div>}
        {error && <div className="text-sm text-red-500 mb-2">{error}</div>}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-3 pr-1">
            {gifts.map(gift => (
              <button
                key={gift.id}
                className="flex flex-col items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900 transition"
                onClick={() => handleSend(gift)}
              >
                <span className="text-3xl">{gift.icon}</span>
                <span className="font-semibold mt-1">{gift.name}</span>
                <span className="text-xs text-fuchsia-500 mt-1">{gift.coins} coins</span>
              </button>
            ))}
            {!loading && !error && gifts.length === 0 && (
              <div className="col-span-2 sm:col-span-3 text-sm text-gray-500 dark:text-gray-400 text-center">No gifts available.</div>
            )}
          </div>
        </div>
        <button className="mt-2 w-full py-2 rounded bg-fuchsia-500 text-white font-semibold" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function deriveIcon(name, idx) {
  const map = {
    rose: "🌹",
    diamond: "💎",
    coffee: "☕",
    heart: "❤️",
    chocolate: "🍫",
    teddy: "🧸",
    ring: "💍",
  };
  const key = String(name || '').toLowerCase();
  for (const k of Object.keys(map)) {
    if (key.includes(k)) return map[k];
  }
  const fallback = ["🎁", "🎀", "💐", "✨", "💖", "🎉"]; 
  return fallback[idx % fallback.length];
}

function deriveAnimation(name) {
  const key = String(name || '').toLowerCase();
  const pairs = [
    ["love note", "envelope_fly"],
    ["single rose", "rose_bloom"],
    ["rose", "rose_bloom"],
    ["chocolate", "chocolate_hearts"],
    ["teddy", "teddy_wave"],
    ["romantic song", "music_notes"],
    ["song", "music_notes"],
    ["candlelight dinner", "wine_clink"],
    ["bouquet", "roses_rain"],
    ["photo frame", "photo_frame"],
    ["kiss", "kiss_blow"],
    ["perfume", "perfume_spray"],
    ["ring", "ring_sparkle"],
    ["weekend getaway", "plane_hearts"],
    ["car ride", "car_hearts"],
    ["home", "home_glow"],
  ];
  for (const [substr, anim] of pairs) {
    if (key.includes(substr)) return anim;
  }
  return "grow_fade";
}