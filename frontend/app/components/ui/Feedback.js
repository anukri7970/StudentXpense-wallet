export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-ink-border/60 rounded-md ${className}`} />;
}

export function PanelSkeleton({ rows = 3 }) {
  return (
    <div className="flex flex-col gap-3 p-5">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-12 px-6">
      {icon && <div className="text-slate-faint mb-1">{icon}</div>}
      <p className="font-display text-lg text-parchment">{title}</p>
      {description && <p className="text-sm text-slate-muted max-w-sm">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
