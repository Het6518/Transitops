import { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/PageLayout';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Spinner, ErrorState, EmptyState, TableSkeleton } from '../components/States';
import { useCanWrite } from '../hooks/useCanWrite';
import { useToast } from '../components/ToastProvider';
import client from '../api/client';

const EMPTY_FORM = {
  name: '', licenseNo: '', licenseCategory: 'HMV',
  licenseExpiry: '', contact: '', safetyScore: '100',
};

const STATUS_OPTIONS = ['AVAILABLE', 'OFF_DUTY', 'SUSPENDED'];

function isExpired(expiryDateStr) {
  return new Date(expiryDateStr) < new Date();
}

export default function DriversPage() {
  const toast = useToast();
  const canCreate = useCanWrite('driver', 'create');
  const canUpdate = useCanWrite('driver', 'update');
  const canDelete = useCanWrite('driver', 'delete');

  const [drivers, setDrivers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving]     = useState(false);

  const fetchDrivers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await client.get('/drivers');
      setDrivers(res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load drivers');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const openAdd  = () => { setForm(EMPTY_FORM); setFormError(''); setModal('add'); };
  const openEdit = (d) => { setForm({ name: d.name, licenseNo: d.licenseNo, licenseCategory: d.licenseCategory, licenseExpiry: d.licenseExpiry?.slice(0, 10) ?? '', contact: d.contact, safetyScore: String(d.safetyScore) }); setFormError(''); setModal(d); };
  const closeModal = () => setModal(null);
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.name.trim())     return 'Name is required';
    if (!form.licenseNo.trim()) return 'License number is required';
    if (!form.licenseExpiry)   return 'License expiry is required';
    if (!form.contact.trim())  return 'Contact is required';
    const score = Number(form.safetyScore);
    if (isNaN(score) || score < 0 || score > 100) return 'Safety score must be between 0 and 100';
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setFormError(err); return; }
    setSaving(true); setFormError('');
    try {
      const body = { ...form, safetyScore: Number(form.safetyScore), licenseExpiry: new Date(form.licenseExpiry).toISOString() };
      if (modal === 'add') {
        await client.post('/drivers', body);
        toast('Driver added');
      } else {
        await client.patch(`/drivers/${modal.id}`, body);
        toast('Driver updated');
      }
      closeModal(); fetchDrivers();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to save driver';
      if (err.response?.status === 409) setFormError(msg);
      else toast(msg, 'error');
    } finally { setSaving(false); }
  };

  const handleStatusToggle = async (driver, newStatus) => {
    if (driver.status === 'ON_TRIP') {
      toast('Cannot change status while driver is On Trip — complete or cancel the trip first', 'warning');
      return;
    }
    try {
      await client.patch(`/drivers/${driver.id}`, { status: newStatus });
      toast('Status updated');
      fetchDrivers();
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Failed to update status', 'error');
    }
  };

  const handleDelete = async (driver) => {
    if (!window.confirm(`Delete driver ${driver.name}?`)) return;
    try {
      await client.delete(`/drivers/${driver.id}`);
      toast('Driver deleted');
      fetchDrivers();
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Failed to delete', 'error');
    }
  };

  return (
    <PageLayout title="Drivers & Safety Profiles">
      <div className="flex justify-end mb-6">
        {canCreate && (
          <button id="driver-add-btn" onClick={openAdd} className="btn-primary text-sm">
            + Add Driver
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-light">
              <tr>
                {['Driver', 'License No', 'Category', 'Expiry', 'Contact', 'Safety %', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-ink-muted uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            {loading ? <TableSkeleton rows={5} cols={8} /> :
             error   ? <tbody><tr><td colSpan={8}><ErrorState message={error} onRetry={fetchDrivers} /></td></tr></tbody> :
             drivers.length === 0 ? <tbody><tr><td colSpan={8}><EmptyState message="No drivers yet — add your first one" /></td></tr></tbody> : (
              <tbody className="divide-y divide-gray-100">
                {drivers.map((d) => {
                  const expired = isExpired(d.licenseExpiry);
                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-ink-onLight">{d.name}</td>
                      <td className="px-4 py-3 text-sm font-mono text-ink-muted">{d.licenseNo}</td>
                      <td className="px-4 py-3 text-sm text-ink-muted">{d.licenseCategory}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={expired ? 'text-status-retired font-semibold flex items-center gap-1' : 'text-ink-muted'}>
                          {expired && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                            </svg>
                          )}
                          {new Date(d.licenseExpiry).toLocaleDateString()}
                          {expired && ' (Expired)'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-muted">{d.contact}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-ink-onLight">{d.safetyScore}%</td>
                      <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {canUpdate && d.status !== 'ON_TRIP' && STATUS_OPTIONS.filter(s => s !== d.status).map(s => (
                            <button
                              key={s}
                              onClick={() => handleStatusToggle(d, s)}
                              className="text-xs text-accent hover:underline focus:outline-none"
                            >
                              {s.replace('_', ' ')}
                            </button>
                          ))}
                          {canUpdate && d.status === 'ON_TRIP' && (
                            <span className="text-xs text-ink-muted italic">On Trip</span>
                          )}
                          {canUpdate && (
                            <button onClick={() => openEdit(d)} className="text-xs text-accent hover:underline focus:outline-none">Edit</button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(d)} className="text-xs text-status-retired hover:underline focus:outline-none">Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>
        <p className="text-xs text-ink-muted px-4 py-2 border-t border-gray-100">
          Expired license or Suspended status → blocked from trip assignment
        </p>
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Driver' : `Edit — ${modal.name}`} onClose={closeModal}>
          <form id="driver-form" onSubmit={handleSave} className="space-y-4">
            {formError && (
              <div id="driver-form-error" className="bg-status-retired/15 border border-status-retired/40 text-status-retired rounded-lg px-4 py-2 text-sm">{formError}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">License No *</label>
                <input name="licenseNo" value={form.licenseNo} onChange={handleChange} required className="input font-mono" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Category</label>
                <select name="licenseCategory" value={form.licenseCategory} onChange={handleChange} className="input">
                  <option value="HMV">HMV</option>
                  <option value="LMV">LMV</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">License Expiry *</label>
                <input name="licenseExpiry" type="date" value={form.licenseExpiry} onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Contact *</label>
                <input name="contact" value={form.contact} onChange={handleChange} required className="input" placeholder="+919876543210" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Safety Score (0–100)</label>
                <input name="safetyScore" type="number" min="0" max="100" value={form.safetyScore} onChange={handleChange} className="input" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={closeModal} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : modal === 'add' ? 'Add Driver' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PageLayout>
  );
}
