/** Spinner shown during data fetches */
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-brand-dark-raised border-t-accent rounded-full animate-spin" />
    </div>
  );
}

/** Error state with optional retry */
export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg className="w-10 h-10 text-status-retired mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p className="text-ink-muted text-sm mb-3">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary text-sm">Retry</button>
      )}
    </div>
  );
}

/** Empty table state */
export function EmptyState({ message = 'No records found', icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon ?? (
        <svg className="w-10 h-10 text-ink-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      )}
      <p className="text-ink-muted text-sm">{message}</p>
    </div>
  );
}

/** Table skeleton loader */
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-t border-brand-dark-raised/20">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <div className="h-3.5 bg-brand-dark-raised/30 rounded animate-pulse" style={{ width: `${60 + (c * 11) % 35}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
