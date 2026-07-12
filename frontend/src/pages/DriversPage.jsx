import { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/PageLayout';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Spinner, ErrorState, EmptyState, TableSkeleton } from '../components/States';
import { useCanWrite } from '../hooks/useCanWrite';
import { useToast } from '../components/ToastProvider';
import client from '../api/client';

import KpiCard from '../components/KpiCard';

const EMPTY_FORM = {
  name: '', email: '', licenseNo: '', licenseCategory: 'HMV',
  licenseExpiry: '', contact: '', safetyScore: '100',
};

const STATUS_OPTIONS = ['AVAILABLE', 'OFF_DUTY', 'SUSPENDED'];

function isExpired(expiryDateStr) {
  return new Date(expiryDateStr) < new Date();
}

const getInitials = (name) => {
  if (!name) return 'D';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return 'D';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

function getExpiryText(expiryDateStr) {
  if (!expiryDateStr) return '—';
  const expiry = new Date(expiryDateStr);
  const now = new Date();
  expiry.setHours(0,0,0,0);
  now.setHours(0,0,0,0);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return `Expired ${Math.abs(diffDays)}d ago`;
  } else if (diffDays === 0) {
    return 'Expires today';
  } else if (diffDays <= 30) {
    return `Expires in ${diffDays}d`;
  }
  return expiry.toLocaleDateString('default', { month: 'short', year: 'numeric' });
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
  const [viewType, setViewType] = useState('cards'); // Default to cards view as in screenshot
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

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
  const openEdit = (d) => { setForm({ name: d.name, email: d.email ?? '', licenseNo: d.licenseNo, licenseCategory: d.licenseCategory, licenseExpiry: d.licenseExpiry?.slice(0, 10) ?? '', contact: d.contact, safetyScore: String(d.safetyScore) }); setFormError(''); setModal(d); };
  const closeModal = () => setModal(null);
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.name.trim())     return 'Name is required';
    if (form.email.trim() && !form.email.includes('@')) return 'Email must be a valid email address';
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

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.licenseNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.email && d.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = !filterStatus || d.status === filterStatus;
    const matchesCategory = !filterCategory || d.licenseCategory === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalDrivers = drivers.length;
  const availableCount = drivers.filter(d => d.status === 'AVAILABLE').length;
  const onTripCount = drivers.filter(d => d.status === 'ON_TRIP').length;
  const avgSafety = drivers.length > 0 ? Math.round(drivers.reduce((sum, d) => sum + d.safetyScore, 0) / drivers.length) : 0;
  const expiringCount = drivers.filter(d => {
    const diff = new Date(d.licenseExpiry).getTime() - new Date().getTime();
    return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <PageLayout title="Driver Management">
      {/* Header action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <p className="text-xs text-ink-muted">Monitor driver records, licenses, safety scores, and assignments.</p>
        {canCreate && (
          <button id="driver-add-btn" onClick={openAdd} className="btn-primary text-sm shrink-0">
            + Register Driver
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <KpiCard label="Total Drivers" value={totalDrivers} accent="bg-status-ontrip" />
        <KpiCard label="Available" value={availableCount} accent="bg-status-available" />
        <KpiCard label="On Trip" value={onTripCount} accent="bg-status-ontrip" />
        <KpiCard label="Avg Safety Score" value={totalDrivers > 0 ? `${avgSafety}` : '—'} accent="bg-accent" />
        <KpiCard label="Licenses Expiring" value={expiringCount} accent="bg-status-retired" />
      </div>

      {/* Filters & View switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search name, license, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-9"
            />
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select text-sm shrink-0"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="OFF_DUTY">Off Duty</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="ON_TRIP">On Trip</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="select text-sm shrink-0"
          >
            <option value="">All Categories</option>
            <option value="HMV">HMV</option>
            <option value="LMV">LMV</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex bg-brand-light p-1 rounded-lg border border-border-color shrink-0 self-end md:self-auto">
          <button
            onClick={() => setViewType('table')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewType === 'table'
                ? 'bg-white dark:bg-brand-dark-raised text-ink-onLight shadow-sm'
                : 'text-ink-muted hover:text-ink-onLight'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setViewType('cards')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewType === 'cards'
                ? 'bg-white dark:bg-brand-dark-raised text-ink-onLight shadow-sm'
                : 'text-ink-muted hover:text-ink-onLight'
            }`}
          >
            Cards
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8">
          <TableSkeleton rows={5} cols={8} />
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-sm p-8">
          <ErrorState message={error} onRetry={fetchDrivers} />
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <EmptyState message="No drivers match the current filters" />
        </div>
      ) : viewType === 'table' ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-light">
                <tr>
                  {['Driver', 'License No', 'Category', 'Expiry', 'Contact', 'Safety %', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-ink-muted uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDrivers.map((d) => {
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
            </table>
          </div>
          <p className="text-xs text-ink-muted px-4 py-2 border-t border-gray-100">
            Expired license or Suspended status → blocked from trip assignment
          </p>
        </div>
      ) : (
        /* Cards View */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDrivers.map((d) => {
              const expired = isExpired(d.licenseExpiry);
              const initials = getInitials(d.name);
              return (
                <div key={d.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    {/* Top Row: Avatar Initials, Name & Status */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center font-bold text-sm text-accent shrink-0">
                          {initials}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-ink-onLight leading-snug">{d.name}</h3>
                          <span className="text-[11px] font-mono text-ink-muted">{d.licenseNo}</span>
                        </div>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>

                    {/* Stats List inside Card */}
                    <div className="space-y-2.5 text-xs pt-3 border-t border-gray-50 dark:border-brand-dark/50">
                      <div className="flex justify-between items-center">
                        <span className="text-ink-muted flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Safety Score
                        </span>
                        <span className="font-semibold text-ink-onLight">{d.safetyScore}%</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-ink-muted flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          License Expiry
                        </span>
                        <span className={`font-semibold ${expired ? 'text-status-retired' : 'text-ink-onLight'}`}>
                          {getExpiryText(d.licenseExpiry)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-ink-muted flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Class
                        </span>
                        <span className="font-semibold text-ink-onLight">{d.licenseCategory}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer row */}
                  <div className="flex items-center gap-3 mt-5 pt-3 border-t border-gray-50 dark:border-brand-dark/50">
                    {canUpdate && (
                      <button
                        onClick={() => openEdit(d)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-border-color rounded-lg text-xs font-semibold text-ink-onLight hover:bg-brand-light transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(d)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-border-color rounded-lg text-xs font-semibold text-status-retired hover:bg-status-retired/10 transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-ink-muted px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100">
            Expired license or Suspended status → blocked from trip assignment
          </p>
        </div>
      )}

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
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Email Address</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} className="input" placeholder="driver@example.com" />
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
