const tones = {
  gold: 'bg-signal-gold/10 text-signal-gold border-signal-gold/30',
  mint: 'bg-mint/10 text-mint border-mint/30',
  coral: 'bg-coral/10 text-coral border-coral/30',
  neutral: 'bg-slate-faint/10 text-slate-muted border-ink-border',
};

export default function Badge({ children, tone = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide border rounded-full px-2.5 py-1 ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
