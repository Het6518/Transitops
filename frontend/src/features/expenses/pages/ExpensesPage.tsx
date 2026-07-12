import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  Search,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  X,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  useExpenseList,
  useExpenseStats,
  useDeleteExpense,
} from '../hooks/useExpenses';
import { Expense } from '../services/expenseService';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/common/PageLoader';
import { cn } from '@/lib/utils';

const categoryColors: Record<string, string> = {
  MAINTENANCE: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  TOLL: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  PARKING: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  REPAIR: 'bg-red-500/10 text-red-500 border-red-500/20',
  MISC: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#a855f7', '#ef4444', '#64748b', '#10b981', '#ec4899'];

export default function ExpensesPage() {
  const { hasPermission } = usePermissions();
  const canDelete = hasPermission('expenses:delete');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useExpenseStats();
  const { data: listData, isLoading: listLoading } = useExpenseList({
    page,
    limit: 10,
    category: categoryFilter || undefined,
  });
  const deleteMutation = useDeleteExpense();

  const handleDelete = (id: string) => {
    if (confirm('Delete this expense?')) {
      deleteMutation.mutate(id, { onSuccess: () => setIsDrawerOpen(false) });
    }
  };

  if (statsLoading || listLoading) return <PageLoader />;

  const expenses = listData?.data || [];
  const meta = listData?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expense Management</h1>
          <p className="text-muted-foreground">Track operational expenses and cost breakdowns</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-3xl font-bold">${stats?.totalAmount?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}</p>
              </div>
              <div className="p-2 bg-red-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Monthly Expenses</p>
                <p className="text-3xl font-bold">${stats?.monthlyAmount?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}</p>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-3xl font-bold">{stats?.thisMonth || 0}</p>
                <p className="text-xs text-muted-foreground">records</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Receipt className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-3xl font-bold">{stats?.categoryBreakdown?.length || 0}</p>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <PieIcon className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Expense by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={(stats?.categoryBreakdown || []).map(cb => ({ name: cb.category, value: cb.amount }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(stats?.categoryBreakdown || []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Expense Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Expense Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <RechartsTooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Amount ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Table */}
      <Card>
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/30">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-background" />
          </div>
          <select
            className="flex h-10 w-full sm:w-48 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Categories</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="TOLL">Toll</option>
            <option value="PARKING">Parking</option>
            <option value="REPAIR">Repair</option>
            <option value="MISC">Misc</option>
          </select>
        </div>

        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b bg-muted/50">
              <tr className="border-b transition-colors">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Vehicle</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Description</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {expenses.map((expense: Expense) => (
                <tr
                  key={expense.id}
                  onClick={() => { setSelectedExpense(expense); setIsDrawerOpen(true); }}
                  className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                >
                  <td className="p-4 align-middle font-medium">{expense.vehicle.plateNumber}</td>
                  <td className="p-4 align-middle">
                    <Badge variant="outline" className={cn("px-2.5 py-0.5", categoryColors[expense.category] || categoryColors.MISC)}>
                      {expense.category}
                    </Badge>
                  </td>
                  <td className="p-4 align-middle font-medium">${expense.amount.toFixed(2)}</td>
                  <td className="p-4 align-middle text-muted-foreground">{format(new Date(expense.date), 'MMM d, yyyy')}</td>
                  <td className="p-4 align-middle text-muted-foreground truncate max-w-[200px]">{expense.description || '—'}</td>
                </tr>
              ))}
              {!expenses.length && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No expenses found.</td></tr>
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
        {isDrawerOpen && selectedExpense && (
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
                  <h2 className="text-lg font-semibold">Expense Details</h2>
                  <p className="text-sm text-muted-foreground">{selectedExpense.vehicle.plateNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(categoryColors[selectedExpense.category] || categoryColors.MISC)}>
                    {selectedExpense.category}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => setIsDrawerOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><p className="text-sm text-muted-foreground">Amount</p><p className="text-2xl font-bold">${selectedExpense.amount.toFixed(2)}</p></div>
                  <div className="space-y-1"><p className="text-sm text-muted-foreground">Date</p><p className="font-medium">{format(new Date(selectedExpense.date), 'MMM d, yyyy')}</p></div>
                  <div className="space-y-1"><p className="text-sm text-muted-foreground">Vehicle</p><p className="font-medium">{selectedExpense.vehicle.model}</p></div>
                  <div className="space-y-1"><p className="text-sm text-muted-foreground">Category</p><p className="font-medium">{selectedExpense.category}</p></div>
                </div>
                {selectedExpense.description && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">{selectedExpense.description}</p>
                  </div>
                )}
                {selectedExpense.trip && (
                  <div className="space-y-1 bg-muted/50 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Linked Trip</p>
                    <p className="font-medium">{selectedExpense.trip.id.slice(0, 8)}... — {selectedExpense.trip.status}</p>
                  </div>
                )}
              </div>
              {canDelete && (
                <div className="p-6 border-t bg-muted/30">
                  <Button variant="destructive" className="w-full gap-2" onClick={() => handleDelete(selectedExpense.id)} disabled={deleteMutation.isPending}>
                    <Trash2 className="h-4 w-4" /> Delete Expense
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
