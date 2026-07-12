import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Plus, Filter, Trash2, Edit2, ChevronLeft, ChevronRight,
  Activity, X, AlertTriangle, Phone, Mail, Award, Calendar,
  TrendingUp, Clock, ShieldCheck, ShieldAlert, ShieldX, UserCheck,
  MapPin, FileText, Car, Navigation
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useDrivers, useDriver, useDriverStatistics,
  useCreateDriver, useUpdateDriver, useDeleteDriver,
} from '../hooks/useDrivers';
import { Driver, DriverStatus, CreateDriverInput } from '../services/driversService';

// ── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<DriverStatus, { label: string; bg: string; text: string; dot: string; Icon: React.ComponentType<any> }> = {
  AVAILABLE:  { label: 'Available',  bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500',  Icon: UserCheck },
  ON_TRIP:    { label: 'On Trip',    bg: 'bg-blue-500/10',    text: 'text-blue-500',    dot: 'bg-blue-500',     Icon: Navigation },
  OFF_DUTY:   { label: 'Off Duty',   bg: 'bg-slate-500/10',   text: 'text-slate-400',   dot: 'bg-slate-500',    Icon: Clock },
  SUSPENDED:  { label: 'Suspended',  bg: 'bg-rose-500/10',    text: 'text-rose-500',    dot: 'bg-rose-500',     Icon: ShieldX },
};

// ── Safety Score Badge ────────────────────────────────────────────────────────
function SafetyBadge({ score }: { score: number }) {
  const color = score >= 90 ? 'text-emerald-500 bg-emerald-500/10' :
                score >= 70 ? 'text-amber-500 bg-amber-500/10' :
                              'text-rose-500 bg-rose-500/10';
  const Icon = score >= 90 ? ShieldCheck : score >= 70 ? ShieldAlert : ShieldX;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>
      <Icon className="h-3 w-3" /> {score.toFixed(1)}
    </span>
  );
}

// ── License Expiry Badge ──────────────────────────────────────────────────────
function LicenseExpiryBadge({ expiry }: { expiry: string }) {
  const expiryDate = new Date(expiry);
  const now = new Date();
  const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = diffDays < 0;
  const isCritical = diffDays >= 0 && diffDays <= 30;
  const isWarning = diffDays > 30 && diffDays <= 90;

  const cls = isExpired ? 'text-rose-500 bg-rose-500/10' :
              isCritical ? 'text-amber-500 bg-amber-500/10' :
              isWarning ? 'text-yellow-500 bg-yellow-500/10' :
              'text-emerald-500 bg-emerald-500/10';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls}`}>
      <Calendar className="h-3 w-3" />
      {isExpired ? `Expired ${Math.abs(diffDays)}d ago` :
       isCritical ? `${diffDays}d left` :
       expiryDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
    </span>
  );
}

// ── Zod Schemas ───────────────────────────────────────────────────────────────
const driverFormSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  contactNumber: z.string().min(7, 'Contact number must be at least 7 characters'),
  licenseNumber: z.string().min(5, 'License number must be at least 5 characters'),
  licenseCategory: z.enum(['A', 'B', 'C', 'D', 'E', 'B+E', 'C+E', 'D+E'], { required_error: 'Select a license category' }),
  licenseExpiry: z.string().min(1, 'License expiry is required'),
  safetyScore: z.coerce.number().min(0).max(100).optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type DriverFormData = z.infer<typeof driverFormSchema>;

// ── Form Component ────────────────────────────────────────────────────────────
function DriverForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  title,
}: {
  defaultValues?: Partial<DriverFormData>;
  onSubmit: (data: DriverFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  title: string;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<DriverFormData>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: defaultValues || { safetyScore: 100 },
  });

  const inputCls = 'w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary';
  const errCls = 'text-[10px] text-destructive mt-0.5';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">First Name *</label>
          <input {...register('firstName')} placeholder="James" className={inputCls} />
          {errors.firstName && <p className={errCls}>{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Last Name *</label>
          <input {...register('lastName')} placeholder="Smith" className={inputCls} />
          {errors.lastName && <p className={errCls}>{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Email *</label>
          <input {...register('email')} type="email" placeholder="driver@transitops.com" className={inputCls} />
          {errors.email && <p className={errCls}>{errors.email.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Contact Number *</label>
          <input {...register('contactNumber')} placeholder="+1 555-000-0000" className={inputCls} />
          {errors.contactNumber && <p className={errCls}>{errors.contactNumber.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">License Number *</label>
          <input {...register('licenseNumber')} placeholder="DL-00001-B" className={inputCls} />
          {errors.licenseNumber && <p className={errCls}>{errors.licenseNumber.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">License Category *</label>
          <select {...register('licenseCategory')} className={inputCls}>
            <option value="">Select category</option>
            {['A', 'B', 'C', 'D', 'E', 'B+E', 'C+E', 'D+E'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.licenseCategory && <p className={errCls}>{errors.licenseCategory.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">License Expiry *</label>
          <input {...register('licenseExpiry')} type="date" className={inputCls} />
          {errors.licenseExpiry && <p className={errCls}>{errors.licenseExpiry.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Safety Score (0–100)</label>
          <input {...register('safetyScore')} type="number" min={0} max={100} step={0.1} placeholder="100" className={inputCls} />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Address</label>
        <input {...register('address')} placeholder="123 Main Street, City" className={inputCls} />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Notes</label>
        <textarea {...register('notes')} rows={2} placeholder="Any additional notes..." className={`${inputCls} resize-none`} />
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : title}
        </Button>
      </div>
    </form>
  );
}

// ── Status Change Dialog ──────────────────────────────────────────────────────
const VALID_TRANSITIONS: Record<DriverStatus, DriverStatus[]> = {
  AVAILABLE: ['ON_TRIP', 'OFF_DUTY', 'SUSPENDED'],
  ON_TRIP:   ['AVAILABLE', 'OFF_DUTY'],
  OFF_DUTY:  ['AVAILABLE', 'SUSPENDED'],
  SUSPENDED: ['OFF_DUTY'],
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DriversPage() {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('drivers:create');
  const canEdit   = hasPermission('drivers:update');
  const canDelete = hasPermission('drivers:delete');

  // Filter state
  const [search, setSearch]       = useState('');
  const [status, setStatus]       = useState('ALL');
  const [category, setCategory]   = useState('ALL');
  const [page, setPage]           = useState(1);
  const [viewMode, setViewMode]   = useState<'table' | 'cards'>('table');

  // Dialog/Drawer state
  const [selectedId, setSelectedId]         = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen]     = useState(false);
  const [editingDriver, setEditingDriver]   = useState<Driver | null>(null);
  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const [changingStatusDriver, setChangingStatusDriver] = useState<Driver | null>(null);

  // Queries & Mutations
  const params = {
    search: search || undefined,
    status: status !== 'ALL' ? (status as DriverStatus) : undefined,
    licenseCategory: category !== 'ALL' ? category : undefined,
    page,
    limit: 8,
  };
  const { data: driversData, isLoading, isError } = useDrivers(params);
  const { data: stats } = useDriverStatistics();
  const { data: detailData, isLoading: isDetailLoading } = useDriver(selectedId);
  const createMutation  = useCreateDriver();
  const updateMutation  = useUpdateDriver();
  const deleteMutation  = useDeleteDriver();

  const handleCreate = async (data: DriverFormData) => {
    await createMutation.mutateAsync(data as CreateDriverInput);
    setIsCreateOpen(false);
  };

  const handleEdit = async (data: DriverFormData) => {
    if (!editingDriver) return;
    await updateMutation.mutateAsync({ id: editingDriver.id, data });
    setEditingDriver(null);
  };

  const handleStatusChange = async (driver: Driver, newStatus: DriverStatus) => {
    await updateMutation.mutateAsync({ id: driver.id, data: { status: newStatus } });
    setChangingStatusDriver(null);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteMutation.mutateAsync(deletingId);
    setDeletingId(null);
    if (selectedId === deletingId) setSelectedId(null);
  };

  // ── Statistics Cards ────────────────────────────────────────────────────────
  const statCards = [
    { label: 'Total Drivers', value: stats?.total ?? '—', icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Available', value: stats?.available ?? '—', icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'On Trip', value: stats?.onTrip ?? '—', icon: Navigation, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Avg Safety Score', value: stats ? `${stats.averageSafetyScore}` : '—', icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Licenses Expiring', value: stats?.expiringSoon ?? '—', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="page-wrapper space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Driver Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor driver records, licenses, safety scores, and assignments.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Register Driver
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="border border-border/80">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-extrabold leading-none">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-border/80">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search name, license, email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-3 py-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="bg-transparent text-xs font-semibold focus:outline-none">
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="OFF_DUTY">Off Duty</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-3 py-1.5">
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="bg-transparent text-xs font-semibold focus:outline-none">
              <option value="ALL">All Categories</option>
              {['A', 'B', 'C', 'D', 'E', 'B+E', 'C+E', 'D+E'].map((c) => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-background border border-border p-1 rounded-lg">
          <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('table')} className="h-8 px-2.5 text-xs">Table</Button>
          <Button variant={viewMode === 'cards' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('cards')} className="h-8 px-2.5 text-xs">Cards</Button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Activity className="h-10 w-10 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground mt-2 animate-pulse">Loading drivers...</p>
        </div>
      ) : isError ? (
        <div className="text-center p-8 bg-destructive/5 rounded-xl border border-destructive/20">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm font-semibold text-destructive">Failed to load drivers</p>
        </div>
      ) : !driversData || driversData.items.length === 0 ? (
        <div className="text-center p-12 bg-muted/20 rounded-xl border border-dashed border-border">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">No drivers found</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Driver</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">License</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expiry</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Safety</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {driversData.items.map((driver) => {
                  const sc = STATUS_CONFIG[driver.status];
                  return (
                    <tr
                      key={driver.id}
                      onClick={() => setSelectedId(driver.id)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-border text-xs font-bold text-primary">
                            {driver.firstName[0]}{driver.lastName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{driver.firstName} {driver.lastName}</p>
                            <p className="text-[10px] text-muted-foreground">{driver.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-mono text-xs font-semibold">{driver.licenseNumber}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Class {driver.licenseCategory}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <LicenseExpiryBadge expiry={driver.licenseExpiry} />
                      </td>
                      <td className="px-5 py-3.5">
                        <SafetyBadge score={driver.safetyScore} />
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); if (canEdit) setChangingStatusDriver(driver); }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text} ${canEdit ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'} transition-opacity`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit && (
                            <Button variant="ghost" size="sm" onClick={() => setEditingDriver(driver)} className="h-8 w-8 p-0">
                              <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="ghost" size="sm" disabled={driver.status === 'ON_TRIP'} onClick={() => setDeletingId(driver.id)} className="h-8 w-8 p-0">
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        // Card View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {driversData.items.map((driver) => {
            const sc = STATUS_CONFIG[driver.status];
            return (
              <Card
                key={driver.id}
                onClick={() => setSelectedId(driver.id)}
                className="hover:shadow-md transition-all cursor-pointer border border-border/80 group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-border text-sm font-bold text-primary">
                        {driver.firstName[0]}{driver.lastName[0]}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold">{driver.firstName} {driver.lastName}</CardTitle>
                        <CardDescription className="text-[10px] font-mono">{driver.licenseNumber}</CardDescription>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${sc.bg} ${sc.text}`}>
                      <span className={`w-1 h-1 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Safety Score</span>
                    <SafetyBadge score={driver.safetyScore} />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">License Expiry</span>
                    <LicenseExpiryBadge expiry={driver.licenseExpiry} />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Class</span>
                    <span className="font-semibold">{driver.licenseCategory}</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
                    {canEdit && (
                      <Button variant="outline" size="sm" onClick={() => setEditingDriver(driver)} className="h-7 px-2 text-xs">
                        <Edit2 className="h-3 w-3 mr-1" /> Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="outline" size="sm" disabled={driver.status === 'ON_TRIP'} onClick={() => setDeletingId(driver.id)} className="h-7 px-2 text-xs hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {driversData && driversData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Showing {((page - 1) * 8) + 1}–{Math.min(page * 8, driversData.total)} of {driversData.total} drivers
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <span className="text-xs px-2">{page} / {driversData.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === driversData.totalPages} onClick={() => setPage(page + 1)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Create Driver Dialog ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-xl rounded-xl border border-border shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-lg">Register New Driver</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DriverForm
                onSubmit={handleCreate}
                onCancel={() => setIsCreateOpen(false)}
                isLoading={createMutation.isPending}
                title="Register Driver"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Edit Driver Dialog ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingDriver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-xl rounded-xl border border-border shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <div>
                  <h3 className="font-bold text-lg">Edit Driver</h3>
                  <p className="text-xs text-muted-foreground">{editingDriver.firstName} {editingDriver.lastName}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditingDriver(null)} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DriverForm
                defaultValues={{
                  firstName: editingDriver.firstName,
                  lastName: editingDriver.lastName,
                  email: editingDriver.email,
                  contactNumber: editingDriver.contactNumber,
                  licenseNumber: editingDriver.licenseNumber,
                  licenseCategory: editingDriver.licenseCategory as any,
                  licenseExpiry: editingDriver.licenseExpiry.substring(0, 10),
                  safetyScore: editingDriver.safetyScore,
                  address: editingDriver.address,
                  notes: editingDriver.notes,
                }}
                onSubmit={handleEdit}
                onCancel={() => setEditingDriver(null)}
                isLoading={updateMutation.isPending}
                title="Save Changes"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Status Change Dialog ───────────────────────────────────────────── */}
      <AnimatePresence>
        {changingStatusDriver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-sm rounded-xl border border-border shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <div>
                  <h3 className="font-bold text-base">Change Status</h3>
                  <p className="text-xs text-muted-foreground">{changingStatusDriver.firstName} {changingStatusDriver.lastName}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setChangingStatusDriver(null)} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-xs text-muted-foreground mb-4">Current status: <strong>{STATUS_CONFIG[changingStatusDriver.status].label}</strong></p>
                {VALID_TRANSITIONS[changingStatusDriver.status].map((st) => {
                  const sc = STATUS_CONFIG[st];
                  return (
                    <Button
                      key={st}
                      variant="outline"
                      className={`w-full justify-start gap-2 ${sc.text}`}
                      disabled={updateMutation.isPending}
                      onClick={() => handleStatusChange(changingStatusDriver, st)}
                    >
                      <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </Button>
                  );
                })}
                {VALID_TRANSITIONS[changingStatusDriver.status].length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No valid status transitions available.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Dialog ─────────────────────────────────────── */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                <h4 className="font-bold text-lg">Remove Driver</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to permanently delete this driver record? This will remove all associated data.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Driver'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Detail Drawer ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedId && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 22 }}
              className="relative w-full max-w-md bg-card border-l border-border h-full shadow-2xl flex flex-col z-10"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
                {detailData ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-2 border-primary/20 text-base font-bold text-primary">
                      {detailData.firstName[0]}{detailData.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{detailData.firstName} {detailData.lastName}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{detailData.licenseNumber}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm font-semibold">Driver Details</span>
                )}
                <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="h-8 w-8 p-0 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Drawer Body */}
              {isDetailLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Activity className="h-8 w-8 text-primary animate-pulse" />
                </div>
              ) : detailData ? (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Status & Scores */}
                  <div className="flex items-center gap-3">
                    {(() => {
                      const sc = STATUS_CONFIG[detailData.status];
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${sc.bg} ${sc.text}`}>
                          <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      );
                    })()}
                    <SafetyBadge score={detailData.safetyScore} />
                    <LicenseExpiryBadge expiry={detailData.licenseExpiry} />
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact Information</h4>
                    <div className="space-y-2 bg-muted/20 rounded-xl p-4 border border-border/60">
                      <div className="flex items-center gap-2 text-xs">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{detailData.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{detailData.contactNumber}</span>
                      </div>
                      {detailData.address && (
                        <div className="flex items-center gap-2 text-xs">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{detailData.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* License Details */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">License Details</h4>
                    <div className="grid grid-cols-2 gap-3 bg-muted/20 rounded-xl p-4 border border-border/60">
                      <div>
                        <span className="text-[10px] text-muted-foreground">License Number</span>
                        <p className="font-mono text-sm font-semibold mt-0.5">{detailData.licenseNumber}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground">Category</span>
                        <p className="text-sm font-bold mt-0.5">Class {detailData.licenseCategory}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-muted-foreground">Expiry Date</span>
                        <div className="mt-1">
                          <LicenseExpiryBadge expiry={detailData.licenseExpiry} />
                          <span className="text-xs text-muted-foreground ml-2">{new Date(detailData.licenseExpiry).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Notes */}
                  {detailData.notes && (
                    <>
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" /> Notes
                        </h4>
                        <p className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/50">{detailData.notes}</p>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Trip History */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Car className="h-3.5 w-3.5" /> Trip History
                    </h4>
                    {detailData.trips && detailData.trips.length > 0 ? (
                      <div className="space-y-2">
                        {detailData.trips.map((trip) => (
                          <div key={trip.id} className="p-3 bg-muted/20 rounded-lg border border-border/50 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{trip.route.name}</span>
                              <Badge variant="secondary" className="text-[9px]">{trip.status}</Badge>
                            </div>
                            <p className="text-muted-foreground">{trip.vehicle.plateNumber} — {trip.vehicle.model}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(trip.createdAt).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground bg-muted/10 p-3 rounded-lg border border-dashed border-border">No trip history found for this driver.</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {(canEdit || canDelete) && (
                    <div className="flex items-center gap-2 pt-2">
                      {canEdit && (
                        <Button className="flex-1" variant="outline" onClick={() => setEditingDriver(detailData)}>
                          <Edit2 className="h-4 w-4 mr-1.5" /> Edit Driver
                        </Button>
                      )}
                      {canDelete && detailData.status !== 'ON_TRIP' && (
                        <Button variant="outline" onClick={() => setDeletingId(detailData.id)} className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
