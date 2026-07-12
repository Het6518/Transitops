const STATUS_LABEL = {
  COMPLETED:  { text: 'Completed',   cls: 'bg-green-100 text-green-700'  },
  DISPATCHED: { text: 'In Progress', cls: 'bg-blue-100  text-blue-700'   },
  DRAFT:      { text: 'Pending',     cls: 'bg-purple-100 text-purple-700' },
  CANCELLED:  { text: 'Cancelled',   cls: 'bg-gray-100  text-gray-600'   },
};

/**
 * RouteInfoCard
 * Floating overlay in the top-right corner of the map showing
 * distance, duration, status, vehicle, and driver.
 */
export default function RouteInfoCard({ trip, distanceKm, durationMin, isFallback }) {
  const { status, vehicle, driver, plannedDistance } = trip;
  const meta = STATUS_LABEL[status] ?? STATUS_LABEL.DRAFT;

  const displayDist = distanceKm ?? (plannedDistance ? `${plannedDistance} (plan)` : '—');
  const displayDur  = durationMin
    ? durationMin < 60
      ? `${durationMin}m`
      : `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
    : '—';

  return (
    <div
      className="absolute top-3 right-3 z-[999] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-3 min-w-[168px] pointer-events-none"
      style={{ fontSize: '12px' }}
    >
      {/* Status badge */}
      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-2 ${meta.cls}`}>
        {meta.text}
      </span>

      {/* Key stats */}
      <div className="space-y-1.5">
        <Row icon="📏" label="Distance"  value={`${displayDist} km`} />
        <Row icon="⏱️" label="Duration"  value={displayDur} />
        <Row icon="🚛" label="Vehicle"   value={vehicle?.regNo ?? '—'} mono />
        <Row icon="👤" label="Driver"    value={driver?.name  ?? '—'} />
      </div>

      {isFallback && (
        <p className="mt-2 text-[9px] text-orange-500 font-semibold">
          ⚠ Straight-line fallback
        </p>
      )}

      {status === 'DRAFT' && (
        <p className="mt-2 text-[9px] text-purple-600 font-semibold leading-tight">
          Route planned. Trip has not started.
        </p>
      )}
    </div>
  );
}

function Row({ icon, label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-400 text-[10px] uppercase tracking-wider whitespace-nowrap">
        {icon} {label}
      </span>
      <span className={`font-semibold text-gray-800 truncate max-w-[90px] ${mono ? 'font-mono text-[10px]' : ''}`}>
        {value}
      </span>
    </div>
  );
}
