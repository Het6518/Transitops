import { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/PageLayout';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { ErrorState, EmptyState, TableSkeleton } from '../components/States';
import { useCanWrite } from '../hooks/useCanWrite';
import { useToast } from '../components/ToastProvider';
import client from '../api/client';

const EMPTY_FORM = { vehicleId: '', description: '', cost: '', startDate: '' };

export default function MaintenancePage() {
  const toast = useToast();
  const canCreate = useCanWrite('maintenance', 'create');
  const canUpdate = useCanWrite('maintenance', 'update');

  const [logs, setLogs]         = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving]     = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [logsRes, vehRes] = await Promise.all([
        client.get('/maintenance'),
        client.get('/vehicles'),
      ]);
      setLogs(logsRes.data);
      setVehicles(vehRes.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load maintenance records');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicleId) { setFormError('Vehicle is required'); return; }
    if (Number(form.cost) < 0) { setFormError('Cost cannot be negative'); return; }
    setSaving(true); setFormError('');
    try {
      await client.post('/maintenance', {
        vehicleId: form.vehicleId,
        description: form.description,
        cost: Number(form.cost) || 0,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      });
      toast('Maintenance record created — vehicle status set to In Shop');
      setModal(false); setForm(EMPTY_FORM); fetchData();
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Failed to create record', 'error');
    } finally { setSaving(false); }
  };

  const handleClose = async (log) => {
    if (!window.confirm(`Close maintenance for vehicle ${log.vehicle?.regNo}?`)) return;
    try {
      await client.patch(`/maintenance/${log.id}/close`);
      toast('Maintenance closed — vehicle restored to Available (unless Retired)');
      fetchData();
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Failed to close record', 'error');
    }
  };

  return (
    <PageLayout title="Maintenance">
      {/* Transition explainer */}
      <div className="bg-status-inshop/10 border border-status-inshop/30 rounded-xl px-4 py-3 mb-6 text-sm text-ink-onLight">
        <strong>Auto-transitions:</strong>{' '}
        Creating a record sets the vehicle to <em>In Shop</em>. Closing a record restores it to{' '}
        <em>Available</em> — unless it's Retired, in which case it stays Retired.
      </div>

      <div className="flex justify-end mb-4">
        {canCreate && (
          <button id="maintenance-add-btn" onClick={() => { setForm(EMPTY_FORM); setFormError(''); setModal(true); }} className="btn-primary text-sm">
            + Log Service Record
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-light">
              <tr>
                {['Vehicle', 'Description', 'Cost', 'Start Date', 'End Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-ink-muted uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            {loading ? <TableSkeleton rows={4} cols={7} /> :
             error   ? <tbody><tr><td colSpan={7}><ErrorState message={error} onRetry={fetchData} /></td></tr></tbody> :
             logs.length === 0 ? <tbody><tr><td colSpan={7}><EmptyState message="No maintenance records yet" /></td></tr></tbody> : (
              <tbody className="divide-y divide-gray-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-ink-onLight">{log.vehicle?.regNo ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-ink-onLight max-w-xs">{log.description}</td>
                    <td className="px-4 py-3 text-sm text-ink-muted">₹{log.cost.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-ink-muted">{new Date(log.startDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-ink-muted">{log.endDate ? new Date(log.endDate).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={log.isActive ? 'ACTIVE' : 'CLOSED'} /></td>
                    <td className="px-4 py-3">
                      {canUpdate && log.isActive && (
                        <button onClick={() => handleClose(log)} className="text-xs text-accent hover:underline">Close</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      </div>

      {modal && (
        <Modal title="Log Service Record" onClose={() => setModal(false)}>
          <form id="maintenance-form" onSubmit={handleSubmit} className="space-y-4">
            {formError && <div className="bg-status-retired/15 border border-status-retired/40 text-status-retired rounded-lg px-4 py-2 text-sm">{formError}</div>}
            <div>
              <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Vehicle *</label>
              <select name="vehicleId" value={form.vehicleId} onChange={handleChange} required className="input">
                <option value="">Select vehicle…</option>
                {vehicles.filter(v => v.status !== 'RETIRED').map(v => (
                  <option key={v.id} value={v.id}>{v.regNo} — {v.name} ({v.status})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} required rows={3} className="input resize-none" placeholder="Engine check, gear tuning…" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Cost (₹)</label>
                <input name="cost" type="number" min="0" value={form.cost} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Start Date</label>
                <input name="startDate" type="date" value={form.startDate} onChange={handleChange} className="input" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Log Record'}</button>
            </div>
          </form>
        </Modal>
      )}
    </PageLayout>
  );
}
