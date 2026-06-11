'use client';

const variants = {
  primary:
    'bg-signal-gold text-ink hover:bg-[#e0b562] active:bg-signal-goldDim disabled:bg-signal-goldDim/50',
  secondary:
    'bg-ink-raised text-parchment border border-ink-border hover:border-slate-faint disabled:opacity-50',
  ghost: 'bg-transparent text-slate-muted hover:text-parchment disabled:opacity-50',
  danger:
    'bg-transparent text-coral border border-coral/40 hover:bg-coral/10 disabled:opacity-50',
};

const sizes = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-base px-5 py-3',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
