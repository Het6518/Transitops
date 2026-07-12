import { useState } from 'react';
import PageLayout from '../components/PageLayout';
import { PAGE_ACCESS, ROLE_DISPLAY_NAME } from '../config/permissions';

// Settings are local-only (no backend endpoint exists) — marked as demo-only
const PAGES = ['dashboard', 'fleet', 'drivers', 'trips', 'maintenance', 'fuelExpenses', 'analytics', 'settings'];
const ROLES = ['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'];

const ACCESS_ICON = {
  full: { icon: '✅', label: 'Full Access', cls: 'text-status-available' },
  view: { icon: '👁',  label: 'View Only',  cls: 'text-status-ontrip' },
  none: { icon: '—',   label: 'No Access',  cls: 'text-ink-muted' },
};

const PAGE_LABELS = {
  dashboard:    'Dashboard',
  fleet:        'Fleet',
  drivers:      'Drivers',
  trips:        'Trips',
  maintenance:  'Maintenance',
  fuelExpenses: 'Fuel & Expenses',
  analytics:    'Analytics',
  settings:     'Settings',
};

export default function SettingsPage() {
  const [depot, setDepot]       = useState('Main Depot');
  const [currency, setCurrency] = useState('INR (₹)');
  const [distUnit, setDistUnit] = useState('km');

  return (
    <PageLayout title="Settings & RBAC">
      {/* General Settings — local-only demo */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-ink-onLight">General Settings</h2>
          <span className="text-xs bg-status-draft/20 text-ink-muted px-2 py-0.5 rounded-full font-medium">Demo only — not persisted</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">Depot Name</label>
            <input
              id="settings-depot"
              value={depot}
              onChange={e => setDepot(e.target.value)}
              className="input-light text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">Currency</label>
            <select
              id="settings-currency"
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="input-light text-sm"
            >
              <option>INR (₹)</option>
              <option>USD ($)</option>
              <option>EUR (€)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">Distance Unit</label>
            <select
              id="settings-dist-unit"
              value={distUnit}
              onChange={e => setDistUnit(e.target.value)}
              className="input-light text-sm"
            >
              <option value="km">Kilometres (km)</option>
              <option value="mi">Miles (mi)</option>
            </select>
          </div>
        </div>
      </div>

      {/* RBAC Table — sourced from the same permissions.js used by route guards */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-ink-onLight">Role-Based Access Control</h2>
          <p className="text-xs text-ink-muted mt-1">
            This table is sourced from the same config that powers route guards — it cannot drift out of sync.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-light">
              <tr>
                <th className="text-left text-xs font-semibold text-ink-muted uppercase tracking-wider px-4 py-3">Page</th>
                {ROLES.map(r => (
                  <th key={r} className="text-center text-xs font-semibold text-ink-muted uppercase tracking-wider px-4 py-3">
                    {ROLE_DISPLAY_NAME[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {PAGES.map(page => (
                <tr key={page} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-ink-onLight">{PAGE_LABELS[page]}</td>
                  {ROLES.map(role => {
                    const access = PAGE_ACCESS[page]?.[role] ?? 'none';
                    const { icon, label, cls } = ACCESS_ICON[access];
                    return (
                      <td key={role} className={`px-4 py-3 text-center text-sm ${cls}`} title={label}>
                        {icon}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-6 text-xs text-ink-muted">
          <span>✅ Full access</span>
          <span>👁 View only</span>
          <span>— No access (route blocked)</span>
        </div>
      </div>
    </PageLayout>
  );
}
