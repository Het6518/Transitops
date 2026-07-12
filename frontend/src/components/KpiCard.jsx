/**
 * KpiCard — reused on Dashboard and Analytics pages.
 * accent prop: Tailwind bg class for the left border color strip.
 */
export default function KpiCard({ label, value, accent = 'bg-accent', sub }) {
  return (
    <div className="bg-white rounded-xl shadow-sm flex overflow-hidden">
      {/* Colored left border strip */}
      <div className={`w-1.5 shrink-0 ${accent}`} />
      <div className="flex-1 px-4 py-4">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-ink-onLight">
          {value ?? <span className="text-ink-muted animate-pulse">—</span>}
        </p>
        {sub && <p className="text-xs text-ink-muted mt-1">{sub}</p>}
      </div>
    </div>
  );
}
