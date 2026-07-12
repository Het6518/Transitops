/** Loading skeleton shown while the map/route is being fetched. */
export default function LoadingMap() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 bg-brand-light dark:bg-brand-dark rounded-xl">
      {/* Animated map-pin pulse */}
      <div className="relative w-14 h-14">
        <span className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
        <span className="absolute inset-2 rounded-full bg-accent/30 animate-ping" style={{ animationDelay: '0.15s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>
      <p className="text-sm font-medium text-ink-muted">Loading route…</p>
      <p className="text-xs text-ink-muted opacity-70">Geocoding locations &amp; fetching driving path</p>
    </div>
  );
}
