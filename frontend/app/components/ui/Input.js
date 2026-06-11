'use client';

import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, hint, className = '', id, ...rest },
  ref
) {
  const inputId = id || rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={`bg-ink-raised border rounded-md px-3.5 py-2.5 text-parchment placeholder:text-slate-faint outline-none transition-colors duration-150 ${
          error ? 'border-coral' : 'border-ink-border focus:border-signal-gold'
        } ${className}`}
        {...rest}
      />
      {error && <span className="text-sm text-coral">{error}</span>}
      {!error && hint && <span className="text-sm text-slate-faint">{hint}</span>}
    </div>
  );
});

export default Input;
