import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation,
  Search,
  Plus,
  Grid,
  List as ListIcon,
  Filter,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  Activity,
  X,
  AlertTriangle,
  FileText,
  DollarSign,
  Droplet,
  CheckCircle,
  XCircle,
  Play,
  ClipboardList
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
  useTrips,
  useTrip,
  useTripStatistics,
  useCreateTrip,
  useDispatchTrip,
  useCompleteTrip,
  useCancelTrip,
  useDeleteTrip
} from '../hooks/useTrips';
import { TripStatus, Trip } from '../services/tripsService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { Separator } from '@/components/ui/separator';

const STATUS_COLORS: Record<TripStatus, { bg: string; text: string; dot: string }> = {
  DRAFT: { bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-400' },
  DISPATCHED: { bg: 'bg-blue-500/10', text: 'text-blue-500', dot: 'bg-blue-500' },
  COMPLETED: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
  CANCELLED: { bg: 'bg-rose-500/10', text: 'text-rose-500', dot: 'bg-rose-500' },
};

export default function TripsPage() {
  const { hasPermission } = usePermissions();
  const canWrite = hasPermission('trips:create');
  const canUpdate = hasPermission('trips:update');
  const canDelete = hasPermission('trips:delete');

  // Search & Filtering State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Dialog / Drawer States
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);

  // API Hooks
  const params = {
    search: search || undefined,
    status: status !== 'ALL' ? (status as TripStatus) : undefined,
    page,
    limit: 8,
  };

  const { data: tripsData, isLoading, isError, refetch } = useTrips(params);
  const { data: stats } = useTripStatistics();
  const { data: detailData, isLoading: isDetailLoading } = useTrip(selectedTripId);

  const createMutation = useCreateTrip();
  const dispatchMutation = useDispatchTrip();
  const completeMutation = useCompleteTrip();
  const cancelMutation = useCancelTrip();
  const deleteMutation = useDeleteTrip();

  // Create Form Select lists (Fetch dynamically from active catalog API endpoints)
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles', 'available-list'],
    queryFn: () => api.get('/vehicles?limit=100').then((res) => res.data.data),
    enabled: isCreateOpen,
  });

  const { data: drivers } = useQuery({
    queryKey: ['drivers', 'available-list'],
    queryFn: () => api.get('/drivers?limit=100').then((res) => res.data.data),
    enabled: isCreateOpen,
  });

  const { data: routes } = useQuery({
    queryKey: ['routes', 'all-list'],
    queryFn: () => api.get('/trips/routes').then((res) => res.data.data),
    enabled: isCreateOpen,
  });

  // Create Trip Form State
  const [formVehicleId, setFormVehicleId] = useState('');
  const [formDriverId, setFormDriverId] = useState('');
  const [formRouteId, setFormRouteId] = useState('');
  const [formCargoWeight, setFormCargoWeight] = useState('');
  const [formCargoDesc, setFormCargoDesc] = useState('');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      vehicleId: formVehicleId,
      driverId: formDriverId,
      routeId: formRouteId,
      cargoWeight: Number(formCargoWeight),
      cargoDescription: formCargoDesc,
    });
    setIsCreateOpen(false);
    setFormVehicleId('');
    setFormDriverId('');
    setFormRouteId('');
    setFormCargoWeight('');
    setFormCargoDesc('');
    refetch();
  };

  const handleDispatch = async (id: string) => {
    await dispatchMutation.mutateAsync(id);
    refetch();
  };

  const handleComplete = async (id: string) => {
    await completeMutation.mutateAsync({ id });
    refetch();
  };

  const handleCancel = async (id: string) => {
    await cancelMutation.mutateAsync(id);
    refetch();
  };

  const handleDeleteConfirm = async () => {
    if (deletingTripId) {
      await deleteMutation.mutateAsync(deletingTripId);
      setDeletingTripId(null);
      refetch();
    }
  };

  return (
    <div className="page-wrapper space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Trip Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dispatch vehicles, manage active cargo dispatches, and log completed trip metrics.
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Create Trip Request
          </Button>
        )}
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-black">{stats?.totalTrips ?? '—'}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total logged</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Navigation className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-black">{stats?.dispatchedCount ?? '—'}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active dispatches</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-black">{stats?.completedCount ?? '—'}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Completed trips</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-black">${stats?.totalCost ? stats.totalCost.toLocaleString() : '—'}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Value Est.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-border/80">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search description, driver, plates..."
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
              <option value="DRAFT">Draft Requests</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
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
          <p className="text-sm text-muted-foreground mt-2 animate-pulse">Loading dispatch journal...</p>
        </div>
      ) : isError || !tripsData ? (
        <div className="text-center p-8 bg-destructive/5 rounded-xl border border-destructive/20">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <h4 className="font-bold text-destructive">Error Loading Dispatch Data</h4>
          <p className="text-xs text-muted-foreground mt-1">Please try again or check connection settings.</p>
        </div>
      ) : tripsData.items.length === 0 ? (
        <div className="text-center p-12 bg-muted/20 rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">No trips matching the search criteria logged.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table Layout */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Route Details</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Driver / Vehicle</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cargo weight</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estimates</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tripsData.items.map((trip) => (
                  <tr
                    key={trip.id}
                    onClick={() => setSelectedTripId(trip.id)}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-sm">{trip.route.name}</span>
                        <span className="text-[10px] text-muted-foreground">{trip.route.startLocation} → {trip.route.endLocation}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-xs">{trip.driver.firstName} {trip.driver.lastName}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">Plate: {trip.vehicle.plateNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold">{trip.cargoWeight} kg</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{trip.cargoDescription}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span>Cost: ${trip.estimatedCost}</span>
                        <span className="text-[10px] text-muted-foreground">Fuel: {trip.estimatedFuel}L</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="font-medium text-[10px]" variant="secondary" style={{
                        backgroundColor: STATUS_COLORS[trip.status]?.bg,
                        color: STATUS_COLORS[trip.status]?.text,
                      }}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${STATUS_COLORS[trip.status]?.dot}`} />
                        {trip.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {canUpdate && trip.status === 'DRAFT' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDispatch(trip.id)}
                            className="h-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 px-2.5 text-xs font-semibold gap-1"
                          >
                            <Play className="h-3 w-3" /> Dispatch
                          </Button>
                        )}
                        {canDelete && trip.status !== 'DISPATCHED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingTripId(trip.id)}
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
          {tripsData.items.map((trip) => (
            <Card
              key={trip.id}
              onClick={() => setSelectedTripId(trip.id)}
              className="hover:shadow-md transition-shadow cursor-pointer border border-border/80"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-[9px]">{trip.vehicle.plateNumber}</Badge>
                  <Badge style={{
                    backgroundColor: STATUS_COLORS[trip.status]?.bg,
                    color: STATUS_COLORS[trip.status]?.text,
                  }} className="text-[10px]">
                    {trip.status}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-bold mt-2 truncate">{trip.route.name}</CardTitle>
                <CardDescription className="text-[10px] truncate">{trip.route.startLocation} → {trip.route.endLocation}</CardDescription>
              </CardHeader>
              <CardContent className="pb-4 pt-0 space-y-2">
                <div className="flex justify-between items-center text-xs mt-2 text-muted-foreground">
                  <span>Driver</span>
                  <span className="font-semibold text-foreground">{trip.driver.firstName} {trip.driver.lastName}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Cargo Weight</span>
                  <span className="font-semibold text-foreground">{trip.cargoWeight} kg</span>
                </div>

                {/* Dispatch changes overlay */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
                  {canUpdate && trip.status === 'DRAFT' ? (
                    <Button variant="outline" size="sm" onClick={() => handleDispatch(trip.id)} className="h-8 text-blue-500 hover:text-blue-600 w-full text-xs gap-1">
                      <Play className="h-3 w-3" /> Dispatch Trip
                    </Button>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Est. Cost: ${trip.estimatedCost}</span>
                  )}
                  {canDelete && trip.status !== 'DISPATCHED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingTripId(trip.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {tripsData && tripsData.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted-foreground">
            Page {tripsData.page} of {tripsData.totalPages} ({tripsData.total} total trips)
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
              disabled={page === tripsData.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Create Trip Dialog Wizard ─────────────────────────────────────────── */}
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
                <h3 className="font-bold text-lg">Create Dispatch Request</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                {/* Route Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Dispatch Route</label>
                  <select
                    required
                    value={formRouteId}
                    onChange={(e) => setFormRouteId(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="">Select Route</option>
                    {routes?.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.name} ({r.distance} km)</option>
                    ))}
                  </select>
                </div>

                {/* Driver & Vehicle Select lists */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Assign Driver</label>
                    <select
                      required
                      value={formDriverId}
                      onChange={(e) => setFormDriverId(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="">Select Driver</option>
                      {drivers?.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Assign Vehicle</label>
                    <select
                      required
                      value={formVehicleId}
                      onChange={(e) => setFormVehicleId(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="">Select Vehicle</option>
                      {vehicles?.map((v: any) => (
                        <option key={v.id} value={v.id}>{v.plateNumber} ({v.model})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cargo Information */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Weight (kg)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      placeholder="1500"
                      value={formCargoWeight}
                      onChange={(e) => setFormCargoWeight(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Cargo Description</label>
                    <input
                      type="text"
                      required
                      placeholder="Medical supplies cargo"
                      value={formCargoDesc}
                      onChange={(e) => setFormCargoDesc(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Logging Draft...' : 'Log Draft Request'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Dialog ────────────────────────────────────── */}
      <AnimatePresence>
        {deletingTripId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                <h4 className="font-bold text-lg">Delete Trip Record</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this trip request? If the trip has already completed or cancelled, this will erase its audit history.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDeletingTripId(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Detail Drawer & Status Tracker ─────────────────────────────────── */}
      <AnimatePresence>
        {selectedTripId && (
          <div className="fixed inset-0 z-40 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTripId(null)}
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
                    <Navigation className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Trip Details</h3>
                    <p className="text-xs text-muted-foreground">ID: {selectedTripId.substring(0, 12)}...</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTripId(null)} className="h-8 w-8 p-0 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Drawer Content */}
              {isDetailLoading ? (
                <div className="flex flex-col items-center justify-center flex-1">
                  <Activity className="h-8 w-8 text-primary animate-pulse" />
                  <p className="text-xs text-muted-foreground mt-2">Loading trip timeline...</p>
                </div>
              ) : detailData ? (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Status Badges & Lifecycle Actions */}
                  <div className="flex flex-col gap-3 bg-muted/30 p-4 rounded-xl border border-border/80">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Workflow State</span>
                      <Badge className="font-medium text-[10px]" style={{
                        backgroundColor: STATUS_COLORS[detailData.status]?.bg,
                        color: STATUS_COLORS[detailData.status]?.text,
                      }}>
                        {detailData.status}
                      </Badge>
                    </div>

                    {/* Quick actions for state transitions */}
                    {canUpdate && (
                      <div className="flex flex-col gap-2 mt-2">
                        {detailData.status === 'DRAFT' && (
                          <Button size="sm" onClick={() => handleDispatch(detailData.id)} className="w-full gap-2">
                            <Play className="h-4 w-4" /> Dispatch Asset Now
                          </Button>
                        )}
                        {detailData.status === 'DISPATCHED' && (
                          <div className="grid grid-cols-2 gap-2">
                            <Button size="sm" variant="default" onClick={() => handleComplete(detailData.id)} className="gap-1.5">
                              <CheckCircle className="h-4 w-4" /> Complete Trip
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleCancel(detailData.id)} className="gap-1.5">
                              <XCircle className="h-4 w-4" /> Cancel Trip
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Route & Cargo Specifications */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trip Specifications</h4>
                    <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/60">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Route</span>
                        <span className="text-sm font-semibold">{detailData.route.name}</span>
                        <span className="text-xs text-muted-foreground block mt-0.5">{detailData.route.startLocation} → {detailData.route.endLocation}</span>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Cargo Description</span>
                          <span className="text-xs font-semibold">{detailData.cargoDescription}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Cargo Weight</span>
                          <span className="text-xs font-semibold">{detailData.cargoWeight} kg</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle & Driver Assignment */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assigned Personnel & Asset</h4>
                    <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border/60">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Driver</span>
                        <span className="text-xs font-semibold">{detailData.driver.firstName} {detailData.driver.lastName}</span>
                        <span className="text-[10px] font-mono text-muted-foreground block mt-0.5">{detailData.driver.licenseNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Vehicle</span>
                        <span className="text-xs font-semibold">{detailData.vehicle.model}</span>
                        <span className="text-[10px] font-mono text-muted-foreground block mt-0.5">{detailData.vehicle.plateNumber} ({detailData.vehicle.type})</span>
                      </div>
                    </div>
                  </div>

                  {/* Cost & Estimates */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cost & Fuel Estimators</h4>
                    <div className="grid grid-cols-3 gap-2 bg-muted/20 p-4 rounded-xl border border-border/60 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-muted-foreground">Estimated Cost</span>
                        <span className="font-bold font-mono text-foreground">${detailData.estimatedCost}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-muted-foreground">Estimated Fuel</span>
                        <span className="font-bold font-mono text-foreground">{detailData.estimatedFuel} L</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-muted-foreground">Route Distance</span>
                        <span className="font-bold font-mono text-foreground">{detailData.route.distance} km</span>
                      </div>
                    </div>
                  </div>

                  {/* Event Timeline */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Lifecycle Timeline
                    </h4>
                    <div className="relative pl-6 border-l border-border space-y-4 text-xs">
                      {/* Created log */}
                      <div className="relative">
                        <span className="absolute -left-8 top-0.5 w-4 h-4 rounded-full bg-slate-500 flex items-center justify-center text-[8px] text-white">✓</span>
                        <span className="font-semibold block">Trip request logged (DRAFT)</span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">Logged: {new Date(detailData.createdAt).toLocaleString()}</span>
                      </div>

                      {/* Dispatched log */}
                      {detailData.startTime && (
                        <div className="relative">
                          <span className="absolute -left-8 top-0.5 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white">✈</span>
                          <span className="font-semibold block">Dispatched</span>
                          <span className="text-[10px] text-muted-foreground block mt-0.5">Started: {new Date(detailData.startTime).toLocaleString()}</span>
                        </div>
                      )}

                      {/* Completed / Cancelled log */}
                      {detailData.endTime && (
                        <div className="relative">
                          <span className={`absolute -left-8 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white ${detailData.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                            {detailData.status === 'COMPLETED' ? '✓' : '✗'}
                          </span>
                          <span className="font-semibold block">{detailData.status}</span>
                          <span className="text-[10px] text-muted-foreground block mt-0.5">Ended: {new Date(detailData.endTime).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
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
