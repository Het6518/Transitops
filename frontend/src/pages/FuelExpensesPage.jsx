import { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/PageLayout';
import Modal from '../components/Modal';
import { ErrorState, EmptyState, TableSkeleton } from '../components/States';
import { useCanWrite } from '../hooks/useCanWrite';
import { useToast } from '../components/ToastProvider';
import client from '../api/client';

export default function FuelExpensesPage() {
  const toast = useToast();
  const canFuel    = useCanWrite('fuelLog', 'create');
  const canExpense = useCanWrite('expense', 'create');
  const canEditFuel   = useCanWrite('fuelLog', 'update');
  const canDeleteFuel = useCanWrite('fuelLog', 'delete');
  const canEditExpense = useCanWrite('expense', 'update');
  const canDeleteExpense = useCanWrite('expense', 'delete');

  const [vehicles, setVehicles] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [modal, setModal]       = useState(null); // 'fuel' | 'expense' | 'editFuel' | 'editExpense'
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm]         = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving]     = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const vehRes = await client.get('/vehicles');
      const vehs = vehRes.data;
      setVehicles(vehs);

      // Fetch all fuel logs and expenses (flat routes, filter by vehicleId client-side)
      const [fuelRes, expRes] = await Promise.all([
        client.get('/fuel-logs'),
        client.get('/expenses'),
      ]);

      // Join vehicle regNo for display
      const vehMap = Object.fromEntries(vehs.map(v => [v.id, v.regNo]));
      const fuelAll = (fuelRes.data ?? []).map(x => ({ ...x, vehicleRegNo: vehMap[x.vehicleId] ?? x.vehicleId }));
      const expAll  = (expRes.data  ?? []).map(x => ({ ...x, vehicleRegNo: vehMap[x.vehicleId] ?? x.vehicleId }));
      setFuelLogs(fuelAll.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setExpenses(expAll.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load data');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openFuel = () => { setForm({ vehicleId: '', liters: '', cost: '', date: '' }); setFormError(''); setModal('fuel'); };
  const openExpense = () => { setForm({ vehicleId: '', type: 'toll', amount: '', date: '' }); setFormError(''); setModal('expense'); };
  const openEditFuel = (f) => {
    setForm({
      vehicleId: f.vehicleId,
      liters: f.liters,
      cost: f.cost,
      date: f.date ? new Date(f.date).toISOString().split('T')[0] : ''
    });
    setFormError('');
    setEditingItem(f);
    setModal('editFuel');
  };
  const openEditExpense = (e) => {
    setForm({
      vehicleId: e.vehicleId,
      type: e.type,
      amount: e.amount,
      date: e.date ? new Date(e.date).toISOString().split('T')[0] : ''
    });
    setFormError('');
    setEditingItem(e);
    setModal('editExpense');
  };
  const closeModal = () => { setModal(null); setEditingItem(null); };
  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicleId)                                      { setFormError('Vehicle is required'); return; }
    if (Number(form.liters) <= 0 || Number(form.cost) <= 0)  { setFormError('Liters and cost must be positive'); return; }
    setSaving(true); setFormError('');
    try {
      const payload = {
        vehicleId: form.vehicleId,
        liters: Number(form.liters),
        cost:   Number(form.cost),
        date:   form.date ? new Date(form.date).toISOString() : undefined,
      };
      if (modal === 'fuel') {
        await client.post('/fuel-logs', payload);
        toast('Fuel log added');
      } else {
        await client.patch(`/fuel-logs/${editingItem.id}`, payload);
        toast('Fuel log updated');
      }
      closeModal(); fetchAll();
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Failed', 'error');
    } finally { setSaving(false); }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicleId)          { setFormError('Vehicle is required'); return; }
    if (Number(form.amount) <= 0) { setFormError('Amount must be positive'); return; }
    setSaving(true); setFormError('');
    try {
      const payload = {
        vehicleId: form.vehicleId,
        type:   form.type,
        amount: Number(form.amount),
        date:   form.date ? new Date(form.date).toISOString() : undefined,
      };
      if (modal === 'expense') {
        await client.post('/expenses', payload);
        toast('Expense logged');
      } else {
        await client.patch(`/expenses/${editingItem.id}`, payload);
        toast('Expense updated');
      }
      closeModal(); fetchAll();
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Failed', 'error');
    } finally { setSaving(false); }
  };

  const handleFuelDelete = async (log) => {
    if (!window.confirm(`Delete this fuel log for vehicle ${log.vehicleRegNo}?`)) return;
    try {
      await client.delete(`/fuel-logs/${log.id}`);
      toast('Fuel log deleted');
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Failed to delete fuel log', 'error');
    }
  };

  const handleExpenseDelete = async (exp) => {
    if (!window.confirm(`Delete this expense for vehicle ${exp.vehicleRegNo}?`)) return;
    try {
      await client.delete(`/expenses/${exp.id}`);
      toast('Expense deleted');
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Failed to delete expense', 'error');
    }
  };

  // Compute total operational cost
  const fuelTotal   = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const totalCost    = fuelTotal + expenseTotal;

  return (
    <PageLayout title="Fuel & Expenses">
      <div className="flex flex-wrap gap-3 justify-end mb-6">
        {canFuel    && <button id="fuel-add-btn"    onClick={openFuel}    className="btn-primary text-sm">+ Log Fuel</button>}
        {canExpense && <button id="expense-add-btn" onClick={openExpense} className="btn-primary text-sm">+ Add Expense</button>}
      </div>

      {loading && <div className="py-16 text-center text-ink-muted text-sm">Loading…</div>}
      {!loading && error && <ErrorState message={error} onRetry={fetchAll} />}
      {!loading && !error && (
        <div className="space-y-8">
          {/* Total Cost Footer */}
          <div className="bg-brand-dark rounded-xl px-6 py-4 flex items-center justify-between">
            <span className="text-ink-onDarkMuted text-sm font-medium">Total Operational Cost</span>
            <span className="text-accent text-2xl font-bold">₹{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          {/* Fuel Logs */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-ink-onLight">Fuel Logs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-brand-light">
                  <tr>
                    {['Vehicle', 'Date', 'Liters', 'Cost (₹)', (canEditFuel || canDeleteFuel) && 'Actions'].filter(Boolean).map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-ink-muted uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                {fuelLogs.length === 0 ? (
                  <tbody><tr><td colSpan={(canEditFuel || canDeleteFuel) ? 5 : 4}><EmptyState message="No fuel logs yet" /></td></tr></tbody>
                ) : (
                  <tbody className="divide-y divide-gray-100">
                    {fuelLogs.map(f => (
                      <tr key={f.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono font-semibold text-ink-onLight">{f.vehicleRegNo}</td>
                        <td className="px-4 py-3 text-sm text-ink-muted">{new Date(f.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm text-ink-muted">{f.liters} L</td>
                        <td className="px-4 py-3 text-sm text-ink-muted">₹{f.cost.toLocaleString()}</td>
                        {(canEditFuel || canDeleteFuel) && (
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-3">
                              {canEditFuel && (
                                <button onClick={() => openEditFuel(f)} className="text-xs text-accent hover:underline focus:outline-none">Edit</button>
                              )}
                              {canDeleteFuel && (
                                <button onClick={() => handleFuelDelete(f)} className="text-xs text-status-retired hover:underline focus:outline-none">Delete</button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-ink-onLight">Other Expenses</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-brand-light">
                  <tr>
                    {['Vehicle', 'Type', 'Date', 'Amount (₹)', (canEditExpense || canDeleteExpense) && 'Actions'].filter(Boolean).map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-ink-muted uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                {expenses.length === 0 ? (
                  <tbody><tr><td colSpan={(canEditExpense || canDeleteExpense) ? 5 : 4}><EmptyState message="No expenses yet" /></td></tr></tbody>
                ) : (
                  <tbody className="divide-y divide-gray-100">
                    {expenses.map(ex => (
                      <tr key={ex.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono font-semibold text-ink-onLight">{ex.vehicleRegNo}</td>
                        <td className="px-4 py-3 text-sm text-ink-muted capitalize">{ex.type}</td>
                        <td className="px-4 py-3 text-sm text-ink-muted">{new Date(ex.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm text-ink-muted">₹{ex.amount.toLocaleString()}</td>
                        {(canEditExpense || canDeleteExpense) && (
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-3">
                              {canEditExpense && (
                                <button onClick={() => openEditExpense(ex)} className="text-xs text-accent hover:underline focus:outline-none">Edit</button>
                              )}
                              {canDeleteExpense && (
                                <button onClick={() => handleExpenseDelete(ex)} className="text-xs text-status-retired hover:underline focus:outline-none">Delete</button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Log/Edit Fuel Modal */}
      {(modal === 'fuel' || modal === 'editFuel') && (
        <Modal title={modal === 'fuel' ? 'Log Fuel' : 'Edit Fuel Log'} onClose={closeModal}>
          <form onSubmit={handleFuelSubmit} className="space-y-4">
            {formError && <div className="bg-status-retired/15 border border-status-retired/40 text-status-retired rounded-lg px-4 py-2 text-sm">{formError}</div>}
            <div>
              <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Vehicle *</label>
              <select name="vehicleId" value={form.vehicleId} onChange={handleChange} required className="input">
                <option value="">Select vehicle…</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.regNo} — {v.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Liters *</label>
                <input name="liters" type="number" min="0.1" step="0.1" value={form.liters} onChange={handleChange} required className="input" /></div>
              <div><label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Cost (₹) *</label>
                <input name="cost" type="number" min="0.01" step="0.01" value={form.cost} onChange={handleChange} required className="input" /></div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Date</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} className="input" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={closeModal} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : (modal === 'fuel' ? 'Log Fuel' : 'Save Changes')}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add/Edit Expense Modal */}
      {(modal === 'expense' || modal === 'editExpense') && (
        <Modal title={modal === 'expense' ? 'Add Expense' : 'Edit Expense'} onClose={closeModal}>
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            {formError && <div className="bg-status-retired/15 border border-status-retired/40 text-status-retired rounded-lg px-4 py-2 text-sm">{formError}</div>}
            <div>
              <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Vehicle *</label>
              <select name="vehicleId" value={form.vehicleId} onChange={handleChange} required className="input">
                <option value="">Select vehicle…</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.regNo} — {v.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Type</label>
                <select name="type" value={form.type} onChange={handleChange} className="input">
                  <option value="toll">Toll</option>
                  <option value="misc">Miscellaneous</option>
                  <option value="repair">Repair</option>
                </select>
              </div>
              <div><label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Amount (₹) *</label>
                <input name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={handleChange} required className="input" /></div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-onDarkMuted mb-1">Date</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} className="input" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={closeModal} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : (modal === 'expense' ? 'Add Expense' : 'Save Changes')}</button>
            </div>
          </form>
        </Modal>
      )}
    </PageLayout>
  );
}
