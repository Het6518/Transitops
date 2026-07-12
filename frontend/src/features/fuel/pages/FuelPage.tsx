import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Fuel,
  Search,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Droplets,
  DollarSign,
  BarChart3,
  X,
  CheckCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import {
  useFuelList,
  useFuelStats,
  useDeleteFuelLog,
} from '../hooks/useFuel';
import { FuelLog } from '../services/fuelService';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/common/PageLoader';
import { cn } from '@/lib/utils';

export default function FuelPage() {
  const { hasPermission } = usePermissions();
  const canWrite = hasPermission('fuel:write');
  const canDelete = hasPermission('fuel:delete');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<FuelLog | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useFuelStats();
  const { data: listData, isLoading: listLoading } = useFuelList({ page, limit: 10 });
  const deleteMutation = useDeleteFuelLog();

  const handleDelete = (id: string) => {
    if (confirm('Delete this fuel log?')) {
      deleteMutation.mutate(id, { onSuccess: () => setIsDrawerOpen(false) });
    }
  };

  if (statsLoading || listLoading) return <PageLoader />;

  const fuelLogs = listData?.data || [];
  const meta = listData?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fuel Management</h1>
          <p className="text-muted-foreground">Track fuel consumption and costs across your fleet</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Fuel Cost</p>
                <p className="text-3xl font-bold">${stats?.totalCost?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}</p>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Monthly Cost</p>
                <p className="text-3xl font-bold">${stats?.monthlyCost?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Liters</p>
                <p className="text-3xl font-bold">{stats?.totalLiters?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}L</p>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Droplets className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Logs</p>
                <p className="text-3xl font-bold">{stats?.total || 0}</p>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Fuel Cost Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <RechartsTooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line type="monotone" dataKey="cost" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Cost ($)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Vehicles by Fuel Cost */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Vehicles by Fuel Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(stats?.topVehicles || []).slice(0, 6).map(v => ({
                  name: v.vehicle.plateNumber,
                  cost: v.totalCost,
                  liters: v.totalLiters
                }))}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <RechartsTooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Cost ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/30">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search fuel logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>

        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b bg-muted/50">
              <tr className="border-b transition-colors">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Vehicle</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Driver</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fuel Type</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Liters</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cost</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Odometer</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {fuelLogs.map((log: FuelLog) => (
                <tr
                  key={log.id}
                  onClick={() => { setSelectedLog(log); setIsDrawerOpen(true); }}
                  className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                >
                  <td className="p-4 align-middle font-medium">{log.vehicle.plateNumber}</td>
                  <td className="p-4 align-middle">{log.driver.firstName} {log.driver.lastName}</td>
                  <td className="p-4 align-middle">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">{log.fuelType}</Badge>
                  </td>
                  <td className="p-4 align-middle">{log.liters.toFixed(1)}L</td>
                  <td className="p-4 align-middle font-medium">${log.cost.toFixed(2)}</td>
                  <td className="p-4 align-middle text-muted-foreground">{log.odometer.toLocaleString()} km</td>
                  <td className="p-4 align-middle text-muted-foreground">{format(new Date(log.loggedAt), 'MMM d, yyyy')}</td>
                </tr>
              ))}
              {!fuelLogs.length && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No fuel logs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page <span className="font-medium">{page}</span> of <span className="font-medium">{meta.totalPages}</span> ({meta.total} records)
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedLog && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" onClick={() => setIsDrawerOpen(false)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-background border-l shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-lg font-semibold">Fuel Log Details</h2>
                  <p className="text-sm text-muted-foreground">{selectedLog.vehicle.plateNumber} — {selectedLog.vehicle.model}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsDrawerOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><p className="text-sm text-muted-foreground">Fuel Type</p><p className="font-medium">{selectedLog.fuelType}</p></div>
                  <div className="space-y-1"><p className="text-sm text-muted-foreground">Liters</p><p className="font-medium">{selectedLog.liters.toFixed(2)}L</p></div>
                  <div className="space-y-1"><p className="text-sm text-muted-foreground">Cost</p><p className="font-medium">${selectedLog.cost.toFixed(2)}</p></div>
                  <div className="space-y-1"><p className="text-sm text-muted-foreground">Odometer</p><p className="font-medium">{selectedLog.odometer.toLocaleString()} km</p></div>
                  <div className="space-y-1"><p className="text-sm text-muted-foreground">Driver</p><p className="font-medium">{selectedLog.driver.firstName} {selectedLog.driver.lastName}</p></div>
                  <div className="space-y-1"><p className="text-sm text-muted-foreground">Date</p><p className="font-medium">{format(new Date(selectedLog.loggedAt), 'MMM d, yyyy HH:mm')}</p></div>
                </div>
                {selectedLog.trip && (
                  <div className="space-y-1 bg-muted/50 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Linked Trip</p>
                    <p className="font-medium">{selectedLog.trip.id.slice(0, 8)}... — {selectedLog.trip.status}</p>
                  </div>
                )}
              </div>
              {canDelete && (
                <div className="p-6 border-t bg-muted/30">
                  <Button variant="destructive" className="w-full gap-2" onClick={() => handleDelete(selectedLog.id)} disabled={deleteMutation.isPending}>
                    <Trash2 className="h-4 w-4" /> Delete Log
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
