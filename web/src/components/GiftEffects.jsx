import React, { useEffect } from 'react';

// Simple effect renderer using CSS keyframes. Each effect auto-cleans after duration.
// Props: effect { id, type, icon, name, durationMs }, onDone(id)
export default function GiftEffects({ effects = [], onDone }) {
  useEffect(() => {
    // Safety cleanup in case durations never fire
    const timers = effects.map(e => setTimeout(() => onDone && onDone(e.id), e.durationMs || 3000));
    return () => timers.forEach(clearTimeout);
  }, [effects, onDone]);

  if (!effects.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center overflow-hidden">
      {effects.map((e) => (
        <EffectItem key={e.id} effect={e} />
      ))}
    </div>
  );
}

function EffectItem({ effect }) {
  const { type, icon, name, durationMs = 3000 } = effect;
  const dur = `${Math.max(2000, Math.min(durationMs, 4000))}ms`;

  // Map effect types to CSS animation classes
  const map = {
    envelope_fly: {
      wrap: `animate-fly-across`,
      extra: '',
    },
    rose_bloom: {
      wrap: `animate-bloom-scale`,
      extra: '',
    },
    chocolate_hearts: {
      wrap: `animate-float-up`,
      extra: 'filter drop-shadow-md',
    },
    teddy_wave: {
      wrap: `animate-bounce-fade`,
      extra: '',
    },
    music_notes: {
      wrap: `animate-float-up-slow`,
      extra: '',
    },
    wine_clink: {
      wrap: `animate-clink`,
      extra: '',
    },
    roses_rain: {
      wrap: `animate-rain`,
      extra: '',
    },
    photo_frame: {
      wrap: `animate-slide-zoom`,
      extra: '',
    },
    kiss_blow: {
      wrap: `animate-blow-kiss`,
      extra: '',
    },
    perfume_spray: {
      wrap: `animate-spray`,
      extra: '',
    },
    ring_sparkle: {
      wrap: `animate-sparkle`,
      extra: '',
    },
    plane_hearts: {
      wrap: `animate-plane`,
      extra: '',
    },
    car_hearts: {
      wrap: `animate-car`,
      extra: '',
    },
    home_glow: {
      wrap: `animate-grow-fade`,
      extra: '',
    },
  };

  const anim = map[type] || { wrap: 'animate-grow-fade', extra: '' };

  const style = {
    animationDuration: dur,
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className={`text-6xl sm:text-7xl md:text-8xl ${anim.wrap}`} style={style}>
        <span className={`${anim.extra}`}>{icon || '🎁'}</span>
        <div className="mt-2 text-center text-sm sm:text-base font-semibold text-fuchsia-600 drop-shadow">
          {name}
        </div>
      </div>
    </div>
  );
}
