import { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/PageLayout';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Spinner, ErrorState, EmptyState, TableSkeleton } from '../components/States';
import { useCanWrite } from '../hooks/useCanWrite';
import { useToast } from '../components/ToastProvider';
import client from '../api/client';
import TripRouteMap from '../components/TripRouteMap/TripRouteMap';

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
  const [selectedTripDetails, setSelectedTripDetails] = useState(null);

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
                    <tr 
                      key={t.id} 
                      onClick={() => setSelectedTripDetails(t)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
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
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDispatch(t); }} 
                              className="text-xs text-accent hover:underline"
                            >
                              Dispatch
                            </button>
                          )}
                          {canComplete && t.status === 'DISPATCHED' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); openComplete(t); }} 
                              className="text-xs text-status-available hover:underline"
                            >
                              Complete
                            </button>
                          )}
                          {canCancel && (t.status === 'DRAFT' || t.status === 'DISPATCHED') && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleCancel(t); }} 
                              className="text-xs text-status-retired hover:underline"
                            >
                              Cancel
                            </button>
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

      {/* Trip Details Side Drawer */}
      {selectedTripDetails && (() => {
        const activeTrip = trips.find(t => t.id === selectedTripDetails.id) || selectedTripDetails;
        const estCost = (activeTrip.plannedDistance * 1.85).toFixed(2);
        const estFuel = (activeTrip.plannedDistance * 0.18).toFixed(1);
        
        return (
          <>
            {/* Backdrop overlay */}
            <div 
              className="fixed inset-0 bg-black/45 backdrop-blur-xs z-45 transition-opacity duration-300"
              onClick={() => setSelectedTripDetails(null)}
            />

            {/* Side Panel */}
            <div className="fixed top-0 right-0 h-full w-[460px] max-w-full bg-white dark:bg-brand-dark-raised shadow-2xl z-50 border-l border-gray-100 dark:border-brand-dark flex flex-col transition-all duration-300 transform translate-x-0">
              
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 dark:border-brand-dark flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-semibold text-base text-ink-onLight">Trip Details</h2>
                    <p className="text-xs text-ink-muted font-mono">{activeTrip.id.substring(0, 18)}...</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTripDetails(null)}
                  className="p-1.5 rounded-lg text-ink-muted hover:bg-brand-light transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                
                {/* Workflow State Block */}
                <div className="flex items-center justify-between py-2.5 px-4 bg-brand-light dark:bg-brand-dark rounded-xl">
                  <span className="text-xs font-semibold text-ink-muted">Workflow State</span>
                  <StatusBadge status={activeTrip.status} />
                </div>

                {/* Quick actions if status allows */}
                {(activeTrip.status === 'DRAFT' || activeTrip.status === 'DISPATCHED') && (
                  <div className="flex gap-3">
                    {canDispatch && activeTrip.status === 'DRAFT' && (
                      <button 
                        onClick={() => handleDispatch(activeTrip)}
                        className="flex-1 btn-primary flex items-center justify-center gap-2 py-2 text-sm"
                      >
                        <svg className="w-4 h-4 transform rotate-45 -translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Dispatch Trip
                      </button>
                    )}
                    {canComplete && activeTrip.status === 'DISPATCHED' && (
                      <button 
                        onClick={() => openComplete(activeTrip)}
                        className="flex-1 btn-primary flex items-center justify-center gap-2 py-2 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Complete Trip
                      </button>
                    )}
                    {canCancel && (activeTrip.status === 'DRAFT' || activeTrip.status === 'DISPATCHED') && (
                      <button 
                        onClick={() => {
                          handleCancel(activeTrip);
                          setSelectedTripDetails(null);
                        }}
                        className="flex-1 border border-status-retired text-status-retired hover:bg-status-retired/10 transition rounded-xl flex items-center justify-center gap-2 py-2 text-sm font-semibold"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Cancel Trip
                      </button>
                    )}
                  </div>
                )}

                {/* TRIP SPECIFICATIONS */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Trip Specifications</h3>
                  <div className="bg-brand-light dark:bg-brand-dark p-4 rounded-xl space-y-4">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-ink-muted mb-1">Route</p>
                      <p className="text-sm font-semibold text-ink-onLight">{activeTrip.source} → {activeTrip.destination}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100 dark:border-brand-dark-raised/50">
                      <div>
                        <p className="text-[10px] uppercase font-semibold text-ink-muted mb-0.5">Cargo Description</p>
                        <p className="text-xs text-ink-onLight font-medium">General Freight / Dry Goods</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-semibold text-ink-muted mb-0.5">Cargo Weight</p>
                        <p className="text-xs text-ink-onLight font-medium">{activeTrip.cargoWeightKg.toLocaleString()} kg</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ASSIGNED PERSONNEL & ASSET */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Assigned Personnel & Asset</h3>
                  <div className="grid grid-cols-2 gap-4 bg-brand-light dark:bg-brand-dark p-4 rounded-xl">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-ink-muted mb-1">Driver</p>
                      <p className="text-sm font-semibold text-ink-onLight leading-tight">{activeTrip.driver?.name ?? '—'}</p>
                      <p className="text-[10px] font-mono text-ink-muted mt-0.5">{activeTrip.driver?.licenseNo ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-ink-muted mb-1">Vehicle</p>
                      <p className="text-sm font-semibold text-ink-onLight leading-tight">{activeTrip.vehicle?.name ?? '—'}</p>
                      <p className="text-[10px] font-mono text-ink-muted mt-0.5">{activeTrip.vehicle?.regNo ?? '—'} ({activeTrip.vehicle?.type ?? '—'})</p>
                    </div>
                  </div>
                </div>

                {/* COST & FUEL ESTIMATORS */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Cost & Fuel Estimators</h3>
                  <div className="grid grid-cols-3 gap-3 bg-brand-light dark:bg-brand-dark p-4 rounded-xl text-center">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-ink-muted mb-1">Estimated Cost</p>
                      <p className="text-sm font-bold text-accent">${estCost}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-ink-muted mb-1">Estimated Fuel</p>
                      <p className="text-sm font-bold text-accent">{estFuel} L</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-ink-muted mb-1">Route Distance</p>
                      <p className="text-sm font-bold text-accent">{activeTrip.plannedDistance} km</p>
                    </div>
                  </div>
                </div>

                {/* TRIP ROUTE MAP */}
                <TripRouteMap trip={activeTrip} />

                {/* LIFECYCLE TIMELINE */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Lifecycle Timeline</h3>
                  <div className="relative border-l-2 border-gray-100 dark:border-brand-dark ml-3 pl-6 space-y-6 text-xs">
                    {/* Draft — always done */}
                    <div className="relative">
                      <span className="absolute -left-[31px] top-0.5 w-5 h-5 rounded-full bg-status-available text-white flex items-center justify-center">
                        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="2,6 5,9 10,3" />
                        </svg>
                      </span>
                      <div>
                        <p className="font-semibold text-ink-onLight">Trip request logged (DRAFT)</p>
                        <p className="text-[10px] text-ink-muted">{new Date(activeTrip.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Dispatched */}
                    <div className="relative">
                      <span className={`absolute -left-[31px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                        activeTrip.dispatchedAt ? 'bg-status-available text-white' : 'bg-gray-200 dark:bg-brand-dark'
                      }`}>
                        {activeTrip.dispatchedAt ? (
                          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="2,6 5,9 10,3" />
                          </svg>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400">2</span>
                        )}
                      </span>
                      <div>
                        <p className={`font-semibold ${activeTrip.dispatchedAt ? 'text-ink-onLight' : 'text-ink-muted'}`}>Dispatched</p>
                        {activeTrip.dispatchedAt && (
                          <p className="text-[10px] text-ink-muted">{new Date(activeTrip.dispatchedAt).toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    {/* Completed / Cancelled */}
                    <div className="relative">
                      <span className={`absolute -left-[31px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                        activeTrip.status === 'COMPLETED' ? 'bg-status-available text-white' :
                        activeTrip.status === 'CANCELLED' ? 'bg-status-retired text-white' :
                        'bg-gray-200 dark:bg-brand-dark'
                      }`}>
                        {activeTrip.status === 'COMPLETED' ? (
                          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="2,6 5,9 10,3" />
                          </svg>
                        ) : activeTrip.status === 'CANCELLED' ? (
                          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="3" x2="9" y2="9" />
                            <line x1="9" y1="3" x2="3" y2="9" />
                          </svg>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400">3</span>
                        )}
                      </span>
                      <div>
                        <p className={`font-semibold ${
                          activeTrip.status === 'COMPLETED' ? 'text-status-available' :
                          activeTrip.status === 'CANCELLED' ? 'text-status-retired' :
                          'text-ink-muted'
                        }`}>
                          {activeTrip.status === 'CANCELLED' ? 'Cancelled' : 'Completed'}
                        </p>
                        {activeTrip.completedAt && (
                          <p className="text-[10px] text-ink-muted">{new Date(activeTrip.completedAt).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </>
        );
      })()}
    </PageLayout>
  );
}
