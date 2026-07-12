import { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/PageLayout';
import KpiCard from '../components/KpiCard';
import { ErrorState } from '../components/States';
import { useCanWrite } from '../hooks/useCanWrite';
import { useToast } from '../components/ToastProvider';
import client from '../api/client';

// Monthly revenue: derived from completed trips × ₹1000 assumption (no real revenue field in backend)
// NOTE: This is a frontend-derived approximation documented here so it's clear in the code.
function deriveMonthlyRevenue(trips) {
  const completed = (trips ?? []).filter(t => t.status === 'COMPLETED');
  const map = {};
  completed.forEach(t => {
    const month = t.completedAt ? new Date(t.completedAt).toLocaleString('default', { month: 'short', year: '2-digit' }) : 'Unknown';
    map[month] = (map[month] || 0) + 1000;
  });
  return Object.entries(map).map(([month, revenue]) => ({ month, revenue }));
}

export default function AnalyticsPage() {
  const toast = useToast();
  const canExport = useCanWrite('report', 'create');

  const [report, setReport]     = useState(null);
  const [alerts, setAlerts]     = useState([]);
  const [maintenSummary, setMaintenSummary] = useState([]);
  const [trips, setTrips]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [repRes, alertRes, maintRes, tripRes] = await Promise.all([
        client.get('/reports'),
        client.get('/reports/license-alerts'),
        client.get('/reports/maintenance-summary'),
        client.get('/trips'),
      ]);
      setReport(repRes.data);
      setAlerts(alertRes.data ?? []);
      setMaintenSummary(maintRes.data ?? []);
      setTrips(tripRes.data ?? []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load analytics');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleExport = async () => {
    try {
      const res = await client.get('/reports/export.csv', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'transitops-report.csv';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      toast('CSV downloaded');
    } catch {
      toast('Export failed', 'error');
    }
  };

  const monthlyRevenue = deriveMonthlyRevenue(trips);
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1);

  const costliest = report?.costliestVehicles ?? [];
  const maxCost   = Math.max(...costliest.map(v => v.totalCost), 1);

  return (
    <PageLayout title="Reports & Analytics">
      {loading && <div className="py-16 text-center text-ink-muted text-sm">Loading…</div>}
      {!loading && error && <ErrorState message={error} onRetry={fetchAll} />}
      {!loading && !error && report && (
        <>
          {/* Actions */}
          <div className="flex justify-end mb-6">
            {canExport && (
              <button id="analytics-export-btn" onClick={handleExport} className="btn-primary text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
            )}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KpiCard label="Fuel Efficiency" value={report.fuelEfficiency != null ? `${report.fuelEfficiency} km/L` : '—'} accent="bg-status-available" />
            <KpiCard label="Fleet Utilization" value={report.fleetUtilization != null ? `${report.fleetUtilization}%` : '—'} accent="bg-status-ontrip" />
            <KpiCard label="Operational Cost" value={report.totalOperationalCost != null ? `₹${Number(report.totalOperationalCost).toLocaleString()}` : '—'} accent="bg-status-inshop" />
            <KpiCard
              label="Vehicle ROI"
              value={report.vehicleROI != null ? `${report.vehicleROI}%` : '—'}
              accent="bg-accent"
              sub="ROI = (revenue − opCost) ÷ acquisitionCost × 100"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Costliest Vehicles */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-ink-onLight mb-4">Top Costliest Vehicles</h2>
              {costliest.length === 0 ? (
                <p className="text-sm text-ink-muted">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {costliest.map((v, i) => (
                    <div key={v.vehicleId ?? i} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-ink-muted w-24 shrink-0">{v.regNo ?? v.vehicleId}</span>
                      <div className="flex-1 h-4 bg-brand-light rounded-full overflow-hidden">
                        <div className="h-full bg-status-inshop rounded-full" style={{ width: `${(v.totalCost / maxCost) * 100}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-ink-onLight w-20 text-right">₹{v.totalCost.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly Revenue — derived from completed trips × ₹1000 assumption */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-ink-onLight mb-1">Monthly Revenue</h2>
              <p className="text-xs text-ink-muted mb-4">
                Derived: completed trips × ₹1,000 flat assumption (no real revenue field in backend)
              </p>
              {monthlyRevenue.length === 0 ? (
                <p className="text-sm text-ink-muted">No completed trips yet</p>
              ) : (
                <div className="flex items-end gap-3 h-32">
                  {monthlyRevenue.map(({ month, revenue }) => (
                    <div key={month} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-xs font-semibold text-ink-onLight">₹{(revenue / 1000).toFixed(0)}k</span>
                      <div className="w-full bg-brand-dark rounded-t-md" style={{ height: `${(revenue / maxRevenue) * 80}px` }} />
                      <span className="text-xs text-ink-muted">{month}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* License Alerts */}
          {alerts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <svg className="w-4 h-4 text-status-inshop" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                </svg>
                <h2 className="text-sm font-semibold text-ink-onLight">License Alerts ({alerts.length})</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {alerts.map(a => (
                  <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink-onLight">{a.name}</p>
                      <p className="text-xs text-ink-muted">{a.licenseNo} · {a.licenseCategory}</p>
                    </div>
                    <span className="text-xs text-status-retired font-semibold">
                      {new Date(a.licenseExpiry) < new Date() ? 'EXPIRED' : 'Expiring'} {new Date(a.licenseExpiry).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Maintenance Summary */}
          {maintenSummary.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-ink-onLight">Maintenance Summary</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-brand-light">
                    <tr>
                      {['Vehicle', 'Total Records', 'Total Cost', 'Active'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-ink-muted uppercase tracking-wider px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {maintenSummary.map((m, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono font-semibold text-ink-onLight">{m.regNo ?? m.vehicleId}</td>
                        <td className="px-4 py-3 text-sm text-ink-muted">{m.totalRecords}</td>
                        <td className="px-4 py-3 text-sm text-ink-muted">₹{m.totalCost?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">{m.activeCount > 0 ? <span className="text-status-inshop font-semibold">{m.activeCount} active</span> : <span className="text-status-available">None</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}
