import { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import KpiCard from '../components/KpiCard';
import StatusBadge from '../components/StatusBadge';
import { Spinner, ErrorState } from '../components/States';
import client from '../api/client';

const STATUS_META = {
  AVAILABLE: { label: 'Available', color: '#2F9E44', textClass: 'text-[#2F9E44]' },
  ON_TRIP:   { label: 'On Trip',   color: '#3B82F6', textClass: 'text-[#3B82F6]' },
  IN_SHOP:   { label: 'In Shop',   color: '#D97706', textClass: 'text-[#D97706]' },
  RETIRED:   { label: 'Retired',   color: '#E5484D', textClass: 'text-[#E5484D]' },
};

function FleetAllocationDonut({ vehicleStatusBars }) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  const statuses = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];
  const total = statuses.reduce((sum, status) => sum + (vehicleStatusBars[status] || 0), 0);

  // If no vehicles, show a placeholder empty state
  if (total === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex flex-col justify-center items-center text-ink-muted text-sm h-full">
        <h2 className="text-sm font-semibold text-ink-onLight mb-2 self-start">Fleet Allocation</h2>
        <p className="text-xs text-ink-muted mb-4 self-start">Current vehicle allocation and operational status</p>
        <p className="text-ink-muted mt-8">No vehicles registered</p>
      </div>
    );
  }

  // Calculate cumulative percentages for Donut slices
  const segments = [];
  let accumulatedPercent = 0;

  statuses.forEach(status => {
    const count = vehicleStatusBars[status] || 0;
    if (count > 0) {
      const percent = count / total;
      segments.push({
        status,
        count,
        percent,
        accumulatedPercent
      });
      accumulatedPercent += percent;
    }
  });

  const radius = 50;
  const cx = 80;
  const cy = 80;
  const circumference = 2 * Math.PI * radius; // 314.159

  const handleMouseMove = (e, status, count) => {
    const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setActiveTooltip({ status, count, x, y });
  };

  const handleMouseLeave = () => {
    setActiveTooltip(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex flex-col justify-between relative h-full">
      <div>
        <h2 className="text-sm font-semibold text-ink-onLight">Fleet Allocation</h2>
        <p className="text-xs text-ink-muted mb-4">Current vehicle allocation and operational status</p>
      </div>

      <div className="relative flex justify-center items-center my-4">
        <svg viewBox="0 0 160 160" className="w-40 h-40 overflow-visible">
          {/* Base/Background circle ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="transparent"
            stroke="var(--border-color)"
            strokeWidth={14}
          />
          
          {/* Segments */}
          {segments.map((seg, idx) => {
            const strokeLength = seg.percent * circumference;
            // Subtract small gap between segments if there are multiple segments
            const displayStrokeLength = segments.length > 1 ? strokeLength - 2 : strokeLength;
            const strokeDasharray = `${Math.max(0.1, displayStrokeLength)} ${circumference}`;
            const strokeDashoffset = -seg.accumulatedPercent * circumference;

            return (
              <circle
                key={seg.status}
                cx={cx}
                cy={cy}
                r={radius}
                fill="transparent"
                stroke={STATUS_META[seg.status].color}
                strokeWidth={14}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(-90 ${cx} ${cy})`}
                className="cursor-pointer transition-all duration-250 hover:stroke-[16px]"
                onMouseMove={(e) => handleMouseMove(e, seg.status, seg.count)}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}

          {/* Central Total indicator */}
          <g className="pointer-events-none">
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              className="text-[10px] font-bold text-ink-muted uppercase tracking-wider"
              fill="currentColor"
            >
              Total
            </text>
            <text
              x={cx}
              y={cy + 12}
              textAnchor="middle"
              className="text-lg font-extrabold text-ink-onLight"
              fill="currentColor"
            >
              {total}
            </text>
          </g>
        </svg>

        {/* Custom floating tooltip overlay */}
        {activeTooltip && (
          <div
            className="absolute bg-white dark:bg-brand-dark-raised text-ink-onLight shadow-lg border border-gray-100 dark:border-brand-dark rounded px-3 py-1.5 text-xs font-semibold pointer-events-none z-10 transition-all duration-75"
            style={{ left: activeTooltip.x + 12, top: activeTooltip.y - 12 }}
          >
            {STATUS_META[activeTooltip.status].label} : {activeTooltip.count}
          </div>
        )}
      </div>

      {/* 2-column Legend grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 max-w-xs mx-auto w-full pt-4 border-t border-gray-100 dark:border-brand-dark">
        {statuses.map(status => {
          const count = vehicleStatusBars[status] || 0;
          const meta = STATUS_META[status];
          return (
            <div key={status} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                <span className="text-ink-muted">{meta.label}</span>
              </div>
              <span className="font-semibold text-ink-onLight">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ vehicleType: '', status: '' });

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.vehicleType) params.vehicleType = filters.vehicleType;
      if (filters.status) params.status = filters.status;
      const res = await client.get('/dashboard', { params });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, [filters]);

  const kpis = data ? [
    { label: 'Active Vehicles',          value: data.activeVehicles,        accent: 'bg-status-ontrip' },
    { label: 'Available Vehicles',        value: data.availableVehicles,     accent: 'bg-status-available' },
    { label: 'Vehicles in Maintenance',   value: data.vehiclesInMaintenance, accent: 'bg-status-inshop' },
    { label: 'Active Trips',              value: data.activeTrips,           accent: 'bg-status-ontrip' },
    { label: 'Pending Trips',             value: data.pendingTrips,          accent: 'bg-status-draft' },
    { label: 'Drivers on Duty',           value: data.driversOnDuty,         accent: 'bg-accent' },
    { label: 'Available Drivers',         value: data.availableDrivers,      accent: 'bg-status-available' },
    { label: 'Fleet Utilization',         value: data.fleetUtilization != null ? `${data.fleetUtilization}%` : '—', accent: 'bg-brand-dark' },
  ] : [];

  const vehicleStatusBars = data?.vehicleStatusBreakdown ?? {};
  const totalVehicles = Object.values(vehicleStatusBars).reduce((a, b) => a + b, 0) || 1;

  const BAR_COLORS = {
    AVAILABLE: 'bg-status-available',
    ON_TRIP:   'bg-status-ontrip',
    IN_SHOP:   'bg-status-inshop',
    RETIRED:   'bg-status-retired',
  };

  return (
    <PageLayout title="Dashboard">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          id="dashboard-filter-type"
          value={filters.vehicleType}
          onChange={(e) => setFilters((f) => ({ ...f, vehicleType: e.target.value }))}
          className="select w-full sm:w-48 text-sm"
        >
          <option value="">All Types</option>
          <option value="truck">Truck</option>
          <option value="van">Van</option>
          <option value="bus">Bus</option>
        </select>
        <select
          id="dashboard-filter-status"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="select w-full sm:w-48 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="IN_SHOP">In Shop</option>
          <option value="RETIRED">Retired</option>
        </select>
      </div>

      {loading && <Spinner />}
      {!loading && error && <ErrorState message={error} onRetry={fetchDashboard} />}
      {!loading && !error && data && (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpis.map((k) => (
              <KpiCard key={k.label} label={k.label} value={k.value} accent={k.accent} />
            ))}
          </div>

          {/* Status Breakdown & Fleet Allocation Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Vehicle Status breakdown */}
            <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-semibold text-ink-onLight">Vehicle Status Breakdown</h2>
                <p className="text-xs text-ink-muted mb-4">Detailed status breakdown of current vehicles</p>
              </div>
              <div className="space-y-4 my-auto">
                {Object.entries(vehicleStatusBars).map(([status, count]) => (
                  <div key={status} className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                    <div className="flex justify-between md:contents">
                      <span className="text-xs text-ink-muted w-24 shrink-0 uppercase tracking-wider">{status.replace('_', ' ')}</span>
                      <span className="text-xs font-semibold text-ink-onLight w-6 text-right md:order-last">{count}</span>
                    </div>
                    <div className="flex-1 h-4 bg-brand-light rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[status] ?? 'bg-brand-dark'}`}
                        style={{ width: `${(count / totalVehicles) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fleet Allocation Donut */}
            <FleetAllocationDonut vehicleStatusBars={vehicleStatusBars} />
          </div>

          {/* Recent Trips Container */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-ink-onLight">Recent Trips</h2>
            </div>
            
            {/* Desktop & Tablet Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-brand-light">
                  <tr>
                    {['Source', 'Destination', 'Vehicle', 'Driver', 'Status'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-ink-muted uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.recentTrips?.length > 0 ? (
                    data.recentTrips.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-ink-onLight">{t.source}</td>
                        <td className="px-4 py-3 text-sm text-ink-onLight">{t.destination}</td>
                        <td className="px-4 py-3 text-sm text-ink-muted font-mono">{t.vehicle?.regNo ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-ink-muted">{t.driver?.name ?? '—'}</td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="text-center text-sm text-ink-muted py-10">No recent trips</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards List */}
            <div className="block md:hidden p-4 space-y-4">
              {data.recentTrips?.length > 0 ? (
                data.recentTrips.map((t) => (
                  <div key={t.id} className="p-4 space-y-3 bg-brand-light rounded-xl border border-brand-dark-raised/20 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block">Source</span>
                        <span className="text-sm font-semibold text-ink-onLight">{t.source}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block">Destination</span>
                        <span className="text-sm font-semibold text-ink-onLight">{t.destination}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-brand-dark-raised/15">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block">Vehicle</span>
                        <span className="text-xs font-mono text-ink-muted truncate block max-w-full">{t.vehicle?.regNo ?? '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block">Driver</span>
                        <span className="text-xs text-ink-muted truncate block max-w-full">{t.driver?.name ?? '—'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-brand-dark-raised/15 flex justify-between items-center">
                      <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">Status</span>
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-ink-muted py-10">No recent trips</div>
              )}
            </div>

          </div>
        </>
      )}
    </PageLayout>
  );
}
