import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus,
  Search,
  Plus,
  Grid,
  List as ListIcon,
  Filter,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  Wrench,
  Flame,
  Activity,
  X,
  AlertTriangle,
  Navigation
} from 'lucide-react';
import {
  useVehicles,
  useVehicle,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle
} from '../hooks/useFleet';
import { VehicleStatus, Vehicle } from '../services/fleetService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { Separator } from '@/components/ui/separator';

const STATUS_COLORS: Record<VehicleStatus, { bg: string; text: string; dot: string }> = {
  AVAILABLE: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
  ON_TRIP: { bg: 'bg-blue-500/10', text: 'text-blue-500', dot: 'bg-blue-500' },
  IN_SHOP: { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500' },
  RETIRED: { bg: 'bg-rose-500/10', text: 'text-rose-500', dot: 'bg-rose-500' },
};

export default function FleetPage() {
  const { hasPermission } = usePermissions();
  const canWrite = hasPermission('fleet:create');
  const canEdit = hasPermission('fleet:update');
  const canDelete = hasPermission('fleet:delete');

  // Search & Filtering State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [type, setType] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Dialog / Drawer States
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);

  // API Hooks
  const params = {
    search: search || undefined,
    status: status !== 'ALL' ? (status as VehicleStatus) : undefined,
    type: type !== 'ALL' ? type : undefined,
    page,
    limit: 8,
  };

  const { data: vehiclesData, isLoading, isError, refetch } = useVehicles(params);
  const { data: detailData, isLoading: isDetailLoading } = useVehicle(selectedVehicleId);
  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();
  const deleteMutation = useDeleteVehicle();

  // Create Vehicle Form State
  const [newPlate, setNewPlate] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newType, setNewType] = useState('Bus');
  const [newFuelType, setNewFuelType] = useState('Diesel');
  const [newFuelCapacity, setNewFuelCapacity] = useState(250);
  const [newMileage, setNewMileage] = useState(0);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      plateNumber: newPlate,
      model: newModel,
      type: newType,
      fuelType: newFuelType,
      fuelCapacity: Number(newFuelCapacity),
      mileage: Number(newMileage),
      status: 'AVAILABLE',
    });
    setIsCreateOpen(false);
    setNewPlate('');
    setNewModel('');
    refetch();
  };

  const handleUpdateStatus = async (vehicle: Vehicle, targetStatus: VehicleStatus) => {
    await updateMutation.mutateAsync({
      id: vehicle.id,
      data: { status: targetStatus },
    });
    setEditingVehicle(null);
    refetch();
  };

  const handleDeleteConfirm = async () => {
    if (deletingVehicleId) {
      await deleteMutation.mutateAsync(deletingVehicleId);
      setDeletingVehicleId(null);
      refetch();
    }
  };

  return (
    <div className="page-wrapper space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Vehicle Registry
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your operational transit assets, monitor statuses, and view trip logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canWrite && (
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Register Vehicle
            </Button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-border/80">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search plate or model..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-3 py-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="IN_SHOP">In Shop</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-3 py-1.5">
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">All Vehicle Types</option>
              <option value="Bus">Buses</option>
              <option value="Van">Vans</option>
              <option value="Truck">Trucks</option>
            </select>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-background border border-border p-1 rounded-lg">
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="h-8 px-2.5"
          >
            <ListIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="h-8 px-2.5"
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Activity className="h-10 w-10 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground mt-2 animate-pulse">Loading vehicle registry...</p>
        </div>
      ) : isError || !vehiclesData ? (
        <div className="text-center p-8 bg-destructive/5 rounded-xl border border-destructive/20">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <h4 className="font-bold text-destructive">Error Loading Registry</h4>
          <p className="text-xs text-muted-foreground mt-1">Please try again or check connection settings.</p>
        </div>
      ) : vehiclesData.items.length === 0 ? (
        <div className="text-center p-12 bg-muted/20 rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">No vehicles registered matching the search query.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table Layout */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Asset Info</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mileage</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fuel System</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vehiclesData.items.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    onClick={() => setSelectedVehicleId(vehicle.id)}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center border border-border">
                          <Bus className="h-5 w-5 text-primary/80" />
                        </div>
                        <div>
                          <span className="font-mono text-sm font-semibold tracking-wide">{vehicle.plateNumber}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">{vehicle.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{vehicle.type}</td>
                    <td className="px-6 py-4 font-mono text-xs">{vehicle.mileage.toLocaleString()} km</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold">{vehicle.fuelType}</span>
                        <span className="text-[10px] text-muted-foreground">Capacity: {vehicle.fuelCapacity}L</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="font-medium text-[10px]" variant={STATUS_COLORS[vehicle.status] ? 'secondary' : 'default'} style={{
                        backgroundColor: STATUS_COLORS[vehicle.status]?.bg,
                        color: STATUS_COLORS[vehicle.status]?.text,
                      }}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${STATUS_COLORS[vehicle.status]?.dot}`} />
                        {vehicle.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingVehicle(vehicle)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={vehicle.status === 'ON_TRIP'}
                            onClick={() => setDeletingVehicleId(vehicle.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Card Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {vehiclesData.items.map((vehicle) => (
            <Card
              key={vehicle.id}
              onClick={() => setSelectedVehicleId(vehicle.id)}
              className="hover:shadow-md transition-shadow cursor-pointer relative group border border-border/80"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-xs font-semibold">{vehicle.plateNumber}</Badge>
                  <Badge style={{
                    backgroundColor: STATUS_COLORS[vehicle.status]?.bg,
                    color: STATUS_COLORS[vehicle.status]?.text,
                  }} className="text-[10px]">
                    {vehicle.status.replace('_', ' ')}
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold mt-2 truncate">{vehicle.model}</CardTitle>
                <CardDescription className="text-xs">{vehicle.type} • {vehicle.fuelType}</CardDescription>
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <div className="flex justify-between items-center text-xs mt-2 text-muted-foreground">
                  <span>Mileage</span>
                  <span className="font-mono font-semibold text-foreground">{vehicle.mileage.toLocaleString()} km</span>
                </div>
                <div className="flex justify-between items-center text-xs mt-1.5 text-muted-foreground">
                  <span>Fuel Capacity</span>
                  <span className="font-semibold text-foreground">{vehicle.fuelCapacity} Liters</span>
                </div>

                {/* Actions overlay on card hover */}
                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
                  {canEdit && (
                    <Button variant="outline" size="sm" onClick={() => setEditingVehicle(vehicle)} className="h-8 px-2 text-xs">
                      <Edit2 className="h-3 w-3 mr-1" /> Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={vehicle.status === 'ON_TRIP'}
                      onClick={() => setDeletingVehicleId(vehicle.id)}
                      className="h-8 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {vehiclesData && vehiclesData.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted-foreground">
            Page {vehiclesData.page} of {vehiclesData.totalPages} ({vehiclesData.total} total assets)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === vehiclesData.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Create Vehicle Dialog ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-lg">Register Asset</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Plate Number</label>
                    <input
                      type="text"
                      required
                      placeholder="TX-1002"
                      value={newPlate}
                      onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Vehicle Model</label>
                    <input
                      type="text"
                      required
                      placeholder="Ford Transit"
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="Bus">Bus</option>
                      <option value="Van">Van</option>
                      <option value="Truck">Truck</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Fuel Type</label>
                    <select
                      value={newFuelType}
                      onChange={(e) => setNewFuelType(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="Diesel">Diesel</option>
                      <option value="Petrol">Petrol</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Fuel Capacity (L)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={newFuelCapacity}
                      onChange={(e) => setNewFuelCapacity(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Initial Mileage (km)</label>
                    <input
                      type="number"
                      min={0}
                      value={newMileage}
                      onChange={(e) => setNewMileage(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Registering...' : 'Register Asset'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Edit Status Dialog ────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingVehicle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <div>
                  <h3 className="font-bold text-base">Modify Vehicle Status</h3>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{editingVehicle.plateNumber} • {editingVehicle.model}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditingVehicle(null)} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs text-muted-foreground">
                  Select the target status. Business rules prevent invalid transitions (e.g. In Shop vehicles must go to Available first, and Retired vehicles cannot be re-activated).
                </p>
                <div className="flex flex-col gap-2">
                  {(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'] as VehicleStatus[]).map((st) => {
                    const isCurrent = editingVehicle.status === st;
                    return (
                      <Button
                        key={st}
                        variant={isCurrent ? 'default' : 'outline'}
                        onClick={() => handleUpdateStatus(editingVehicle, st)}
                        disabled={isCurrent || updateMutation.isPending}
                        className="justify-between"
                      >
                        <span>{st.replace('_', ' ')}</span>
                        {isCurrent && <Badge variant="secondary" className="text-[10px]">Current</Badge>}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Dialog ────────────────────────────────────── */}
      <AnimatePresence>
        {deletingVehicleId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                <h4 className="font-bold text-lg">Confirm Asset Deletion</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this vehicle from the registry? This action is permanent and will delete all associated operational logs.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDeletingVehicleId(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Detail Drawer ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedVehicleId && (
          <div className="fixed inset-0 z-40 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVehicleId(null)}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative w-full max-w-md bg-card border-l border-border h-full shadow-2xl flex flex-col z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Bus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-mono text-base font-bold tracking-wide">{detailData?.plateNumber || 'Asset Details'}</h3>
                    <p className="text-xs text-muted-foreground">{detailData?.model}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedVehicleId(null)} className="h-8 w-8 p-0 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Drawer Content */}
              {isDetailLoading ? (
                <div className="flex flex-col items-center justify-center flex-1">
                  <Activity className="h-8 w-8 text-primary animate-pulse" />
                  <p className="text-xs text-muted-foreground mt-2">Loading asset timeline...</p>
                </div>
              ) : detailData ? (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Basic Specifications */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Specifications</h4>
                    <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/80">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Fuel Capacity</span>
                        <span className="text-sm font-semibold">{detailData.fuelCapacity} Liters</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Fuel Type</span>
                        <span className="text-sm font-semibold">{detailData.fuelType}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Odometer Reading</span>
                        <span className="text-sm font-semibold font-mono">{detailData.mileage.toLocaleString()} km</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Operational Class</span>
                        <span className="text-sm font-semibold">{detailData.type}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Operational Timeline / Recent Trips */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Navigation className="h-3.5 w-3.5" /> Recent Dispatched Trips
                    </h4>
                    {detailData.trips && detailData.trips.length > 0 ? (
                      <div className="space-y-3">
                        {detailData.trips.map((trip) => (
                          <div key={trip.id} className="flex flex-col gap-1 p-3 bg-muted/20 rounded-lg border border-border/50 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">{trip.route.name}</span>
                              <Badge className="text-[9px]" variant="secondary">{trip.status}</Badge>
                            </div>
                            <p className="text-muted-foreground mt-0.5">Driver: {trip.driver.firstName} {trip.driver.lastName}</p>
                            <span className="text-[10px] text-muted-foreground mt-1">Dispatched: {new Date(trip.createdAt).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground bg-muted/10 p-3 rounded-lg border border-dashed border-border">No trip dispatch logs for this asset.</p>
                    )}
                  </div>

                  <Separator />

                  {/* Maintenance Log */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5" /> Maintenance Log
                    </h4>
                    {detailData.maintenances && detailData.maintenances.length > 0 ? (
                      <div className="space-y-3">
                        {detailData.maintenances.map((m) => (
                          <div key={m.id} className="flex flex-col gap-1 p-3 bg-muted/20 rounded-lg border border-border/50 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold truncate max-w-[200px]">{m.description}</span>
                              <span className="font-semibold text-rose-500">${m.cost}</span>
                            </div>
                            <p className="text-muted-foreground mt-0.5">Status: {m.status}</p>
                            <span className="text-[10px] text-muted-foreground mt-1">Date: {new Date(m.startDate).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground bg-muted/10 p-3 rounded-lg border border-dashed border-border">No workshop logs found.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
