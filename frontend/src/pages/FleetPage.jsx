import { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/PageLayout';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Spinner, ErrorState, EmptyState, TableSkeleton } from '../components/States';
import { useCanWrite } from '../hooks/useCanWrite';
import { useToast } from '../components/ToastProvider';
import client from '../api/client';

const EMPTY_FORM = { regNo: '', name: '', type: 'truck', maxLoadKg: '', odometer: '', acquisitionCost: '' };

export default function FleetPage() {
  const toast = useToast();
  const canCreate = useCanWrite('vehicle', 'create');
  const canUpdate = useCanWrite('vehicle', 'update');
  const canDelete = useCanWrite('vehicle', 'delete');

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filters, setFilters]   = useState({ type: '', status: '', search: '' });
  const [modal, setModal]       = useState(null); // null | 'add' | vehicle object (edit)
  const [form, setForm]         = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving]     = useState(false);

  const fetchVehicles = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (filters.type)   params.type   = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      const res = await client.get('/vehicles', { params });
      setVehicles(res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load vehicles');
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const openAdd  = () => { setForm(EMPTY_FORM); setFormError(''); setModal('add'); };
  const openEdit = (v) => { setForm({ regNo: v.regNo, name: v.name, type: v.type, maxLoadKg: v.maxLoadKg, odometer: v.odometer, acquisitionCost: v.acquisitionCost }); setFormError(''); setModal(v); };
  const closeModal = () => setModal(null);

  const handleFormChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validateForm = () => {
    if (!form.regNo.trim()) return 'Registration number is required';
    if (!form.name.trim())  return 'Name is required';
    if (isNaN(form.maxLoadKg) || Number(form.maxLoadKg) <= 0) return 'Max load must be a positive number';
    if (isNaN(form.odometer) || Number(form.odometer) < 0)   return 'Odometer must be a non-negative number';
    if (isNaN(form.acquisitionCost) || Number(form.acquisitionCost) <= 0) return 'Acquisition cost must be a positive number';
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) { setFormError(err); return; }
    setSaving(true); setFormError('');
    try {
      const body = { ...form, maxLoadKg: Number(form.maxLoadKg), odometer: Number(form.odometer), acquisitionCost: Number(form.acquisitionCost) };
      if (modal === 'add') {
        await client.post('/vehicles', body);
        toast('Vehicle added successfully');
      } else {
        await client.patch(`/vehicles/${modal.id}`, body);
        toast('Vehicle updated');
      }
      closeModal();
      fetchVehicles();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to save vehicle';
      if (err.response?.status === 409) setFormError(msg);
      else toast(msg, 'error');
    } finally { setSaving(false); }
  };

  const handleRetire = async (vehicle) => {
    if (!window.confirm(`Retire vehicle ${vehicle.regNo}? This cannot be undone.`)) return;
    try {
      await client.patch(`/vehicles/${vehicle.id}`, { status: 'RETIRED' });
      toast('Vehicle retired');
      fetchVehicles();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Cannot retire vehicle';
      toast(msg, 'error');
    }
  };

  const handleDelete = async (vehicle) => {
    if (!window.confirm(`Delete vehicle ${vehicle.regNo}?`)) return;
    try {
      await client.delete(`/vehicles/${vehicle.id}`);
      toast('Vehicle deleted');
      fetchVehicles();
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Failed to delete', 'error');
    }
  };

  return (
    <PageLayout title="Fleet — Vehicle Registry">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          id="fleet-search"
          type="text"
          placeholder="Search reg no…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="input-light w-48 text-sm"
        />
        <select id="fleet-filter-type" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))} className="input-light w-36 text-sm">
          <option value="">All Types</option>
          <option value="truck">Truck</option>
          <option value="van">Van</option>
          <option value="bus">Bus</option>
        </select>
        <select id="fleet-filter-status" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="input-light w-40 text-sm">
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="IN_SHOP">In Shop</option>
          <option value="RETIRED">Retired</option>
        </select>
        <div className="ml-auto">
          {canCreate && (
            <button id="fleet-add-btn" onClick={openAdd} className="btn-primary text-sm">
              + Add Vehicle
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-light">
              <tr>
                {['Reg No', 'Name / Model', 'Type', 'Capacity (kg)', 'Odometer', 'Acq. Cost', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-ink-muted uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton rows={5} cols={8} />
            ) : error ? (
              <tbody><tr><td colSpan={8}><ErrorState message={error} onRetry={fetchVehicles} /></td></tr></tbody>
            ) : vehicles.length === 0 ? (
              <tbody><tr><td colSpan={8}><EmptyState message="No vehicles yet — add your first one" /></td></tr></tbody>
            ) : (
              <tbody className="divide-y divide-gray-100">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-ink-onLight">{v.regNo}</td>
                    <td className="px-4 py-3 text-sm text-ink-onLight">{v.name}</td>
                    <td className="px-4 py-3 text-sm text-ink-muted capitalize">{v.type}</td>
                    <td className="px-4 py-3 text-sm text-ink-muted">{v.maxLoadKg.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-ink-muted font-mono">{v.odometer.toLocaleString()} km</td>
                    <td className="px-4 py-3 text-sm text-ink-muted">₹{v.acquisitionCost.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {canUpdate && v.status !== 'RETIRED' && (
                          <button onClick={() => openEdit(v)} className="text-xs text-accent hover:underline focus:outline-none">Edit</button>
                        )}
                        {canUpdate && v.status !== 'RETIRED' && (
                          <button onClick={() => handleRetire(v)} className="text-xs text-status-inshop hover:underline focus:outline-none">Retire</button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(v)} className="text-xs text-status-retired hover:underline focus:outline-none">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        <p className="text-xs text-ink-muted px-4 py-2 border-t border-gray-100">
          Registration No. must be unique · Retired/In Shop vehicles are hidden from Trip Dispatcher
        </p>
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <Modal title={modal === 'add' ? 'Add Vehicle' : `Edit — ${modal.regNo}`} onClose={closeModal}>
          <form id="vehicle-form" onSubmit={handleSave} className="space-y-4">
            {formError && (
              <div id="vehicle-form-error" className="bg-status-retired/15 border border-status-retired/40 text-status-retired rounded-lg px-4 py-2 text-sm">{formError}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Reg No *</label>
                <input name="regNo" value={form.regNo} onChange={handleFormChange} required className="input" placeholder="MH12AB1234" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Name / Model *</label>
                <input name="name" value={form.name} onChange={handleFormChange} required className="input" placeholder="Fleet Truck 1" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Type</label>
                <select name="type" value={form.type} onChange={handleFormChange} className="input">
                  <option value="truck">Truck</option>
                  <option value="van">Van</option>
                  <option value="bus">Bus</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Max Load (kg) *</label>
                <input name="maxLoadKg" type="number" min="1" value={form.maxLoadKg} onChange={handleFormChange} required className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Odometer (km)</label>
                <input name="odometer" type="number" min="0" value={form.odometer} onChange={handleFormChange} className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Acquisition Cost (₹) *</label>
                <input name="acquisitionCost" type="number" min="1" value={form.acquisitionCost} onChange={handleFormChange} required className="input" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={closeModal} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : modal === 'add' ? 'Add Vehicle' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PageLayout>
  );
}
