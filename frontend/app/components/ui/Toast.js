'use client';

import { useEffect } from 'react';

export default function Toast({ message, tone = 'mint', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const toneClasses =
    tone === 'coral'
      ? 'border-coral/40 text-coral'
      : tone === 'gold'
      ? 'border-signal-gold/40 text-signal-gold'
      : 'border-mint/40 text-mint';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 bg-ink-panel border ${toneClasses} rounded-md px-4 py-3 shadow-panel text-sm font-medium max-w-sm animate-toast-in`}
    >
      {message}
    </div>
  );
}
