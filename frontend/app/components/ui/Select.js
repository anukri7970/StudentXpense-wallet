'use client';

import { forwardRef } from 'react';

const Select = forwardRef(function Select(
  { label, error, children, className = '', id, ...rest },
  ref
) {
  const selectId = id || rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-slate-muted">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        className={`bg-ink-raised border rounded-md px-3.5 py-2.5 text-parchment outline-none transition-colors duration-150 ${
          error ? 'border-coral' : 'border-ink-border focus:border-signal-gold'
        } ${className}`}
        {...rest}
      >
        {children}
      </select>
      {error && <span className="text-sm text-coral">{error}</span>}
    </div>
  );
});

export default Select;
