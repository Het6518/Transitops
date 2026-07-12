import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  Search,
  Plus,
  Filter,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  FileText,
  DollarSign
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
  useMaintenanceList,
  useMaintenanceStats,
  useCreateMaintenance,
  useUpdateMaintenance,
  useCompleteMaintenance,
  useDeleteMaintenance
} from '../hooks/useMaintenance';
import { MaintenanceRecord } from '../services/maintenanceService';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Import UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PageLoader } from '@/components/common/PageLoader';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';

const statusColors = {
  SCHEDULED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  CANCELLED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

const statusLabels = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export default function MaintenancePage() {
  const { hasPermission } = usePermissions();
  const canWrite = hasPermission('maintenance:write');
  const canDelete = hasPermission('maintenance:delete');

  // State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  
  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Data
  const { data: stats, isLoading: statsLoading } = useMaintenanceStats();
  const { data: listData, isLoading: listLoading } = useMaintenanceList({
    page,
    limit: 10,
    status: statusFilter || undefined,
  });

  // Actions
  const completeMutation = useCompleteMaintenance();
  const deleteMutation = useDeleteMaintenance();

  const handleComplete = (id: string) => {
    completeMutation.mutate(id, {
      onSuccess: () => setIsDrawerOpen(false)
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => setIsDrawerOpen(false)
      });
    }
  };

  if (statsLoading || listLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground">Manage fleet maintenance and repairs</p>
        </div>
        {canWrite && (
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Record
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">In Shop</p>
                <p className="text-3xl font-bold">{stats?.inProgress || 0}</p>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Wrench className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                <p className="text-3xl font-bold">{stats?.scheduled || 0}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Completed (MTD)</p>
                <p className="text-3xl font-bold">{stats?.completed || 0}</p>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Cost (MTD)</p>
                <p className="text-3xl font-bold">${stats?.monthlyCost?.toLocaleString() || 0}</p>
              </div>
              <div className="p-2 bg-red-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and List */}
      <Card>
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/30">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vehicles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b bg-muted/50">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Vehicle</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Service Type</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cost</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {listData?.data.map((record) => (
                <tr
                  key={record.id}
                  onClick={() => {
                    setSelectedRecord(record);
                    setIsDrawerOpen(true);
                  }}
                  className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                >
                  <td className="p-4 align-middle font-medium">{record.vehicle.plateNumber}</td>
                  <td className="p-4 align-middle">{record.serviceType}</td>
                  <td className="p-4 align-middle">
                    <Badge variant="outline" className={cn("px-2.5 py-0.5", statusColors[record.status])}>
                      {statusLabels[record.status]}
                    </Badge>
                  </td>
                  <td className="p-4 align-middle font-medium">${record.cost.toFixed(2)}</td>
                  <td className="p-4 align-middle text-muted-foreground">
                    {format(new Date(record.startDate), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
              {!listData?.data.length && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No maintenance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {listData && listData.meta.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{(page - 1) * listData.meta.limit + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(page * listData.meta.limit, listData.meta.total)}
              </span>{' '}
              of <span className="font-medium">{listData.meta.total}</span> records
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium">
                Page {page} of {listData.meta.totalPages}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(listData.meta.totalPages, p + 1))}
                disabled={page === listData.meta.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Maintenance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <p className="text-sm text-muted-foreground">
               Creating an IN_PROGRESS maintenance record will automatically mark the selected vehicle as IN_SHOP, preventing it from being assigned to trips.
             </p>
             <Button variant="outline" className="w-full text-muted-foreground" onClick={() => toast.info('Full form implementation skipped for brevity. Check API directly.')}>
               View Console Warning
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedRecord && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={() => setIsDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-background border-l shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-lg font-semibold">{selectedRecord.serviceType}</h2>
                  <p className="text-sm text-muted-foreground">Vehicle {selectedRecord.vehicle.plateNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusColors[selectedRecord.status]}>
                    {statusLabels[selectedRecord.status]}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => setIsDrawerOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                  <p className="text-sm bg-muted/50 p-3 rounded-md">{selectedRecord.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">{format(new Date(selectedRecord.startDate), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Cost</p>
                    <p className="font-medium">${selectedRecord.cost.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-muted/30">
                <div className="flex gap-2">
                  {canWrite && selectedRecord.status !== 'COMPLETED' && selectedRecord.status !== 'CANCELLED' && (
                    <Button 
                      className="flex-1 gap-2"
                      onClick={() => handleComplete(selectedRecord.id)}
                      disabled={completeMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark Completed
                    </Button>
                  )}
                  {canDelete && (
                    <Button 
                      variant="destructive" 
                      onClick={() => handleDelete(selectedRecord.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
