import { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/PageLayout';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Spinner, ErrorState, EmptyState, TableSkeleton } from '../components/States';
import { useCanWrite } from '../hooks/useCanWrite';
import { useToast } from '../components/ToastProvider';
import client from '../api/client';

const EMPTY_FORM = {
  source: '', destination: '', vehicleId: '', driverId: '',
  cargoWeightKg: '', plannedDistance: '',
};
const COMPLETE_FORM = { actualOdometer: '', fuelConsumed: '' };

// Subtext for the Live Board, derived client-side from trip/vehicle state
function tripSubtext(trip) {
  if (trip.status === 'DRAFT' && !trip.driverId) return 'Awaiting driver';
  if (trip.status === 'DRAFT' && trip.vehicle?.status === 'IN_SHOP') return 'Vehicle went to shop';
  if (trip.status === 'DISPATCHED') return `En route: ${trip.source} → ${trip.destination}`;
  if (trip.status === 'COMPLETED') return `Completed ${new Date(trip.completedAt).toLocaleDateString()}`;
  if (trip.status === 'CANCELLED') return 'Trip cancelled';
  return '';
}

const STEPPER_STEPS = ['DRAFT', 'DISPATCHED', 'COMPLETED'];

export default function TripsPage() {
  const toast = useToast();
  const canCreate   = useCanWrite('trip', 'create');
  const canDispatch = useCanWrite('trip', 'dispatch');
  const canComplete = useCanWrite('trip', 'complete');
  const canCancel   = useCanWrite('trip', 'cancel');

  const [trips, setTrips]         = useState([]);
  const [vehicles, setVehicles]   = useState([]);
  const [drivers, setDrivers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [modal, setModal]         = useState(null);     // null | 'create' | 'complete'
  const [completeTrip, setCompleteTrip] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [completeForm, setCompleteForm] = useState(COMPLETE_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving]       = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [tripsRes, vehRes, drvRes] = await Promise.all([
        client.get('/trips'),
        client.get('/vehicles', { params: { status: 'AVAILABLE' } }),
        client.get('/drivers'),
      ]);
      setTrips(tripsRes.data);
      setVehicles(vehRes.data);
      setDrivers(drvRes.data.filter(d => d.status === 'AVAILABLE' && new Date(d.licenseExpiry) > new Date() && d.status !== 'SUSPENDED'));
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load trips');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === 'vehicleId') {
      setSelectedVehicle(vehicles.find(v => v.id === value) ?? null);
    }
  };

  // Capacity check
  const cargoNum = Number(form.cargoWeightKg);
  const capacityExceeded = selectedVehicle && cargoNum > 0 && cargoNum > selectedVehicle.maxLoadKg;
  const overBy = capacityExceeded ? (cargoNum - selectedVehicle.maxLoadKg) : 0;

  const openCreate = () => {
    setForm(EMPTY_FORM); setFormError(''); setSelectedVehicle(null); setModal('create');
  };
  const openComplete = (trip) => {
    setCompleteTrip(trip); setCompleteForm(COMPLETE_FORM); setFormError(''); setModal('complete');
  };
  const closeModal = () => setModal(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (capacityExceeded) { setFormError(`Capacity exceeded by ${overBy} kg — dispatch blocked`); return; }
    if (!form.vehicleId || !form.driverId) { setFormError('Vehicle and driver are required'); return; }
    setSaving(true); setFormError('');
    try {
      await client.post('/trips', {
        ...form,
        cargoWeightKg: Number(form.cargoWeightKg),
        plannedDistance: Number(form.plannedDistance),
      });
      toast('Trip created');
      closeModal(); fetchAll();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to create trip';
      if (err.response?.status === 409) setFormError(msg);
      else toast(msg, 'error');
    } finally { setSaving(false); }
  };

  const handleDispatch = async (trip) => {
    try {
      await client.post(`/trips/${trip.id}/dispatch`);
      toast('Trip dispatched');
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Dispatch failed', 'error');
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    if (!completeForm.actualOdometer || !completeForm.fuelConsumed) { setFormError('Both fields required'); return; }
    setSaving(true); setFormError('');
    try {
      await client.post(`/trips/${completeTrip.id}/complete`, {
        actualOdometer: Number(completeForm.actualOdometer),
        fuelConsumed: Number(completeForm.fuelConsumed),
      });
      toast('Trip completed');
      closeModal(); fetchAll();
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Complete failed', 'error');
    } finally { setSaving(false); }
  };

  const handleCancel = async (trip) => {
    if (!window.confirm('Cancel this trip?')) return;
    try {
      await client.post(`/trips/${trip.id}/cancel`);
      toast('Trip cancelled');
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Cancel failed', 'error');
    }
  };

  const stepIdx = (status) => STEPPER_STEPS.indexOf(status);

  return (
    <PageLayout title="Trip Dispatcher">
      <div className="flex justify-end mb-6">
        {canCreate && (
          <button id="trip-create-btn" onClick={openCreate} className="btn-primary text-sm">
            + Create Trip
          </button>
        )}
      </div>

      {loading && <Spinner />}
      {!loading && error && <ErrorState message={error} onRetry={fetchAll} />}
      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-ink-onLight">Live Board</h2>
          </div>
          {trips.length === 0 ? (
            <EmptyState message="No trips yet — create your first trip" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-brand-light">
                  <tr>
                    {['Route', 'Vehicle', 'Driver', 'Cargo (kg)', 'Progress', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-ink-muted uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trips.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-ink-onLight">{t.source} → {t.destination}</p>
                        <p className="text-xs text-ink-muted">{tripSubtext(t)}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-ink-muted">{t.vehicle?.regNo ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-ink-muted">{t.driver?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-ink-muted">{t.cargoWeightKg.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {/* Stepper */}
                        <div className="flex items-center gap-1">
                          {STEPPER_STEPS.map((step, i) => {
                            const current = stepIdx(t.status);
                            const done = i <= current && t.status !== 'CANCELLED';
                            return (
                              <div key={step} className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${done ? 'bg-status-available' : t.status === 'CANCELLED' ? 'bg-status-retired' : 'bg-gray-300'}`} />
                                {i < STEPPER_STEPS.length - 1 && <div className={`w-6 h-0.5 ${i < current ? 'bg-status-available' : 'bg-gray-200'}`} />}
                              </div>
                            );
                          })}
                          {t.status === 'CANCELLED' && <span className="text-xs text-status-retired ml-1">Cancelled</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {canDispatch && t.status === 'DRAFT' && (
                            <button onClick={() => handleDispatch(t)} className="text-xs text-accent hover:underline">Dispatch</button>
                          )}
                          {canComplete && t.status === 'DISPATCHED' && (
                            <button onClick={() => openComplete(t)} className="text-xs text-status-available hover:underline">Complete</button>
                          )}
                          {canCancel && (t.status === 'DRAFT' || t.status === 'DISPATCHED') && (
                            <button onClick={() => handleCancel(t)} className="text-xs text-status-retired hover:underline">Cancel</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Trip Modal */}
      {modal === 'create' && (
        <Modal title="Create Trip" onClose={closeModal} size="lg">
          <form id="trip-form" onSubmit={handleCreate} className="space-y-4">
            {formError && (
              <div id="trip-form-error" className="bg-status-retired/15 border border-status-retired/40 text-status-retired rounded-lg px-4 py-2 text-sm">{formError}</div>
            )}
            {capacityExceeded && !formError && (
              <div className="bg-status-retired/15 border border-status-retired/40 text-status-retired rounded-lg px-4 py-2 text-sm">
                Capacity exceeded by {overBy.toFixed(0)} kg — dispatch blocked
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Source *</label>
                <input name="source" value={form.source} onChange={handleChange} required className="input" placeholder="Warehouse North" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Destination *</label>
                <input name="destination" value={form.destination} onChange={handleChange} required className="input" placeholder="Outlet East" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Vehicle (Available only) *</label>
                <select name="vehicleId" value={form.vehicleId} onChange={handleChange} required className="input">
                  <option value="">Select vehicle…</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.regNo} — {v.name} ({v.maxLoadKg} kg cap.)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Driver (Available only) *</label>
                <select name="driverId" value={form.driverId} onChange={handleChange} required className="input">
                  <option value="">Select driver…</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} — {d.licenseCategory}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Cargo Weight (kg) *</label>
                <input name="cargoWeightKg" type="number" min="1" value={form.cargoWeightKg} onChange={handleChange} required className="input" />
                {selectedVehicle && (
                  <p className="text-xs text-ink-onDarkMuted mt-1">Vehicle capacity: {selectedVehicle.maxLoadKg.toLocaleString()} kg</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Planned Distance (km) *</label>
                <input name="plannedDistance" type="number" min="1" value={form.plannedDistance} onChange={handleChange} required className="input" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={closeModal} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={saving || capacityExceeded} className="btn-primary">
                {saving ? 'Creating…' : 'Create Trip'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Complete Trip Modal */}
      {modal === 'complete' && completeTrip && (
        <Modal title={`Complete Trip — ${completeTrip.source} → ${completeTrip.destination}`} onClose={closeModal}>
          <form id="complete-form" onSubmit={handleComplete} className="space-y-4">
            {formError && <div className="bg-status-retired/15 border border-status-retired/40 text-status-retired rounded-lg px-4 py-2 text-sm">{formError}</div>}
            <div>
              <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Actual Odometer (km) *</label>
              <input type="number" min="0" value={completeForm.actualOdometer} onChange={e => setCompleteForm(f => ({ ...f, actualOdometer: e.target.value }))} required className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Fuel Consumed (L) *</label>
              <input type="number" min="0" step="0.1" value={completeForm.fuelConsumed} onChange={e => setCompleteForm(f => ({ ...f, fuelConsumed: e.target.value }))} required className="input" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={closeModal} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Completing…' : 'Mark Complete'}</button>
            </div>
          </form>
        </Modal>
      )}
    </PageLayout>
  );
}
