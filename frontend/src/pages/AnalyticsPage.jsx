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

// Monthly Fuel Cost Trend Chart Component — Animated + Interactive
function FuelTrendChart({ fuelLogs }) {
  const [tooltip, setTooltip] = useState(null);
  const [activeDot, setActiveDot] = useState(null);

  const monthlyMap = {};
  fuelLogs.forEach(log => {
    if (!log.date) return;
    const d = new Date(log.date);
    if (isNaN(d.getTime())) return;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + log.cost;
  });

  const sortedMonths = Object.keys(monthlyMap).sort();
  const chartData = sortedMonths.map(month => ({
    label: month,
    value: monthlyMap[month]
  })).slice(-6);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5 h-64 flex flex-col justify-center items-center text-ink-muted text-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-ink-onLight mb-2 self-start">Monthly Fuel Cost Trend</h3>
        <p className="text-ink-muted">No fuel logs recorded yet</p>
      </div>
    );
  }

  const width = 500;
  const height = 220;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;
  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  const values = chartData.map(d => d.value);
  const maxVal = Math.max(...values, 6000);
  const yCeil = maxVal > 6000 ? Math.ceil(maxVal / 1000) * 1000 : 6000;

  const gridCount = 4;
  const gridSteps = Array.from({ length: gridCount + 1 }, (_, i) => (yCeil / gridCount) * i);

  const points = chartData.map((d, i) => {
    const x = paddingLeft + (chartData.length > 1 ? (i / (chartData.length - 1)) * graphWidth : graphWidth / 2);
    const y = paddingTop + graphHeight - (d.value / yCeil) * graphHeight;
    return { x, y, label: d.label, value: d.value };
  });

  // Cubic bezier line path
  let lineD = '';
  if (points.length > 0) {
    lineD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      lineD += ` C ${cpX1} ${p0.y}, ${cpX2} ${p1.y}, ${p1.x} ${p1.y}`;
    }
  }

  // Area fill path (same curve, closed at bottom)
  const areaD = lineD
    + ` L ${points[points.length - 1].x} ${paddingTop + graphHeight}`
    + ` L ${points[0].x} ${paddingTop + graphHeight} Z`;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-ink-onLight">Monthly Fuel Cost Trend</h3>
        {tooltip && (
          <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
            {tooltip.label} — ₹{tooltip.value.toLocaleString()}
          </span>
        )}
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">

          {/* Gradient defs */}
          <defs>
            <linearGradient id="fuelAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines & Y Labels */}
          {gridSteps.map((step, idx) => {
            const y = paddingTop + graphHeight - (step / yCeil) * graphHeight;
            return (
              <g key={step}>
                {idx > 0 && (
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y}
                    stroke="var(--border-color)" strokeDasharray="3 3" strokeWidth={1} />
                )}
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end"
                  fill="currentColor" className="text-[10px] font-medium text-ink-muted">
                  {Math.round(step / 1000)}k
                </text>
              </g>
            );
          })}

          {/* Axes */}
          <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + graphHeight}
            stroke="var(--border-color)" strokeWidth={1} />
          <line x1={paddingLeft} y1={paddingTop + graphHeight} x2={width - paddingRight} y2={paddingTop + graphHeight}
            stroke="var(--border-color)" strokeWidth={1} />

          {/* Area fill — fades in */}
          {lineD && (
            <path d={areaD} fill="url(#fuelAreaGrad)" className="chart-area-in" />
          )}

          {/* Animated line draw */}
          {lineD && (
            <path d={lineD} fill="none" stroke="#3B82F6" strokeWidth={2.5}
              strokeLinecap="round" strokeLinejoin="round" className="chart-line-draw" />
          )}

          {/* X-axis labels */}
          {points.map((pt, idx) => (
            <g key={idx}>
              <line x1={pt.x} y1={paddingTop + graphHeight} x2={pt.x} y2={paddingTop + graphHeight + 4}
                stroke="var(--border-color)" strokeWidth={1} />
              <text x={pt.x} y={height - 10} textAnchor="middle"
                fill="currentColor" className="text-[10px] font-medium text-ink-muted">
                {pt.label}
              </text>
            </g>
          ))}

          {/* Interactive data points */}
          {points.map((pt, idx) => (
            <g
              key={idx}
              className="chart-dot-in cursor-pointer"
              style={{ animationDelay: `${0.8 + idx * 0.08}s` }}
              onMouseEnter={() => { setTooltip(pt); setActiveDot(idx); }}
              onMouseLeave={() => { setTooltip(null); setActiveDot(null); }}
            >
              {/* Hover pulse ring */}
              {activeDot === idx && (
                <circle cx={pt.x} cy={pt.y} r={10} fill="#3B82F6" opacity={0.15} />
              )}
              {/* Outer ring */}
              <circle cx={pt.x} cy={pt.y} r={activeDot === idx ? 6 : 4}
                fill="var(--bg-card)" stroke="#3B82F6"
                strokeWidth={activeDot === idx ? 2.5 : 2}
                style={{ transition: 'r 0.15s ease, stroke-width 0.15s ease' }}
              />
              {/* Inner filled dot */}
              <circle cx={pt.x} cy={pt.y} r={activeDot === idx ? 3 : 2}
                fill="#3B82F6" />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}


// Top Vehicles by Fuel Cost Chart Component — Animated + Interactive
function FuelVehiclesChart({ fuelLogs }) {
  const [activeBar, setActiveBar] = useState(null);

  const vehicleMap = {};
  fuelLogs.forEach(log => {
    if (!log.vehicle?.regNo) return;
    const regNo = log.vehicle.regNo;
    vehicleMap[regNo] = (vehicleMap[regNo] || 0) + log.cost;
  });

  const sortedVehicles = Object.entries(vehicleMap)
    .map(([regNo, cost]) => ({ label: regNo, value: cost }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  if (sortedVehicles.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5 h-64 flex flex-col justify-center items-center text-ink-muted text-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-ink-onLight mb-2 self-start">Top Vehicles by Fuel Cost</h3>
        <p className="text-ink-muted">No fuel logs recorded yet</p>
      </div>
    );
  }

  const width = 500;
  const height = 220;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;
  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  const values = sortedVehicles.map(d => d.value);
  const maxVal = Math.max(...values, 1600);
  const yCeil = maxVal > 1600 ? Math.ceil(maxVal / 400) * 400 : 1600;

  const gridCount = 4;
  const gridSteps = Array.from({ length: gridCount + 1 }, (_, i) => (yCeil / gridCount) * i);

  const barCount = sortedVehicles.length;
  const barWidth = (graphWidth / barCount) * 0.6;
  const gap = (graphWidth / barCount) * 0.4;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-ink-onLight">Top Vehicles by Fuel Cost</h3>
        {activeBar !== null && (
          <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
            {sortedVehicles[activeBar].label} — ₹{sortedVehicles[activeBar].value.toLocaleString()}
          </span>
        )}
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">

          <defs>
            <linearGradient id="barGradDefault" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="1" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818CF8" stopOpacity="1" />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Grid lines + Y labels */}
          {gridSteps.map((step, idx) => {
            const y = paddingTop + graphHeight - (step / yCeil) * graphHeight;
            return (
              <g key={step}>
                {idx > 0 && (
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y}
                    stroke="var(--border-color)" strokeDasharray="3 3" strokeWidth={1} />
                )}
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end"
                  fill="currentColor" className="text-[10px] font-medium text-ink-muted">
                  {Math.round(step)}
                </text>
              </g>
            );
          })}

          {/* Axes */}
          <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + graphHeight}
            stroke="var(--border-color)" strokeWidth={1} />
          <line x1={paddingLeft} y1={paddingTop + graphHeight} x2={width - paddingRight} y2={paddingTop + graphHeight}
            stroke="var(--border-color)" strokeWidth={1} />

          {/* Animated bars */}
          {sortedVehicles.map((d, i) => {
            const x = paddingLeft + i * (barWidth + gap) + gap / 2;
            const barHeight = Math.max((d.value / yCeil) * graphHeight, 2);
            const y = paddingTop + graphHeight - barHeight;
            const isActive = activeBar === i;
            const r = 4;
            // Rounded top corners path
            const pathD = barHeight <= r
              ? `M ${x} ${y} L ${x + barWidth} ${y} L ${x + barWidth} ${y + barHeight} L ${x} ${y + barHeight} Z`
              : `M ${x} ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} L ${x + barWidth - r} ${y} A ${r} ${r} 0 0 1 ${x + barWidth} ${y + r} L ${x + barWidth} ${y + barHeight} L ${x} ${y + barHeight} Z`;

            return (
              <g
                key={i}
                className="bar-grow cursor-pointer"
                style={{ animationDelay: `${i * 0.08}s`, animationDuration: '0.55s' }}
                onMouseEnter={() => setActiveBar(i)}
                onMouseLeave={() => setActiveBar(null)}
              >
                <path
                  d={pathD}
                  fill={isActive ? 'url(#barGradHover)' : 'url(#barGradDefault)'}
                  style={{ transition: 'fill 0.15s ease', filter: isActive ? 'drop-shadow(0 2px 6px rgba(99,102,241,0.4))' : 'none' }}
                />
                {/* Value label above bar on hover */}
                {isActive && (
                  <text x={x + barWidth / 2} y={y - 5} textAnchor="middle"
                    fill="#6366F1" className="text-[9px] font-bold">
                    ₹{(d.value / 1000).toFixed(1)}k
                  </text>
                )}
              </g>
            );
          })}

          {/* X-axis labels */}
          {sortedVehicles.map((d, i) => {
            const x = paddingLeft + i * (barWidth + gap) + gap / 2 + barWidth / 2;
            return (
              <g key={i}>
                <line x1={x} y1={paddingTop + graphHeight} x2={x} y2={paddingTop + graphHeight + 4}
                  stroke="var(--border-color)" strokeWidth={1} />
                <text x={x} y={height - 10} textAnchor="middle"
                  fill="currentColor" className="text-[9px] font-semibold text-ink-muted">
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}


export default function AnalyticsPage() {
  const toast = useToast();
  const canExport = useCanWrite('report', 'create');

  const [report, setReport]     = useState(null);
  const [alerts, setAlerts]     = useState([]);
  const [maintenSummary, setMaintenSummary] = useState([]);
  const [trips, setTrips]       = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError]       = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [repRes, alertRes, maintRes, tripRes, orgRes] = await Promise.all([
        client.get('/reports'),
        client.get('/reports/license-alerts'),
        client.get('/reports/maintenance-summary'),
        client.get('/trips'),
        client.get('/organizations').catch(() => ({ data: [] })),
      ]);
      setReport(repRes.data);
      setAlerts(alertRes.data ?? []);
      setMaintenSummary(maintRes.data ?? []);
      setTrips(tripRes.data ?? []);
      setOrganizations(orgRes.data ?? []);
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

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await client.get('/reports/export.pdf', { responseType: 'blob' });
      const file = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(file);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `transitops-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast('PDF report downloaded successfully');
    } catch (err) {
      toast('Failed to download PDF report', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  const monthlyRevenue = deriveMonthlyRevenue(trips);
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1);

  const costliest = report?.costliestVehicles ?? [];
  const maxCost   = Math.max(...costliest.map(v => v.totalCost), 1);

  const rois      = report?.vehicleROIs ?? [];
  const maxRoi    = Math.max(...rois.map(v => v.roi), 1);

  return (
    <PageLayout title="Reports & Analytics">
      {loading && <div className="py-16 text-center text-ink-muted text-sm">Loading…</div>}
      {!loading && error && <ErrorState message={error} onRetry={fetchAll} />}
      {!loading && !error && report && (
        <>
          {/* Actions */}
          <div className="flex justify-end gap-3 mb-6">
            <button
              id="analytics-pdf-btn"
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="btn-primary text-sm flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
            >
              {pdfLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating PDF…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF Report
                </>
              )}
            </button>
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
          
          {/* Fuel Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <FuelTrendChart fuelLogs={report.fuelLogs ?? []} />
            <FuelVehiclesChart fuelLogs={report.fuelLogs ?? []} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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

            {/* Top Vehicle ROI */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-ink-onLight mb-4">Top Vehicle ROI</h2>
              {rois.length === 0 ? (
                <p className="text-sm text-ink-muted">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {rois.map((v, i) => (
                    <div key={v.vehicleId ?? i} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-ink-muted w-24 shrink-0">{v.regNo ?? v.vehicleId}</span>
                      <div className="flex-1 h-4 bg-brand-light rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${Math.max(0, (v.roi / maxRoi) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-ink-onLight w-20 text-right">{v.roi.toLocaleString()}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly Revenue — derived from completed trips × ₹1000 assumption */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-ink-onLight mb-1">Monthly Revenue</h2>
              <p className="text-xs text-ink-muted mb-4">
                Derived: completed trips × ₹1,000 flat assumption
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
