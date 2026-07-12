import { motion } from 'framer-motion';
import {
  Bus,
  Users,
  Navigation,
  TrendingUp,
  Activity,
  Clock,
  DollarSign,
  AlertTriangle,
  Flame,
  Plus,
  Play,
  RotateCw,
  AlertCircle
} from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useDashboard } from '../hooks/useDashboard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { dashboardData, isLoading, isError, refetch, isFetching } = useDashboard();
  const today = formatDate(new Date());

  const handleRefetch = async () => {
    try {
      await refetch();
      toast.success('Dashboard Refreshed: Latest operational metrics are now loaded.');
    } catch {
      toast.error('Refresh Failed: Could not fetch updated metrics from server.');
    }
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Activity className="h-10 w-10 text-primary animate-pulse" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading enterprise operational metrics...</p>
      </div>
    );
  }

  // Error Screen
  if (isError || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto px-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
        <h3 className="text-lg font-bold">Failed to load Dashboard</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          There was an error connecting to the TransitOps analytics engine. Please check your network or try again.
        </p>
        <Button onClick={handleRefetch} className="gap-2">
          <RotateCw className="h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  const { kpis, activity, charts } = dashboardData;

  // Permissions-based visualization checks
  const canSeeFinance = hasPermission('finance:read');
  const canSeeFuel = hasPermission('fuel:read');
  const canSeeMaintenance = hasPermission('maintenance:read');

  return (
    <div className="page-wrapper space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome back, {user?.firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {today} — Smart Transport Operations Platform (TransitOps) Summary.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefetch}
            disabled={isFetching}
            className="gap-2 border-primary/20 hover:border-primary/50"
          >
            <RotateCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Sync Metrics
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-2 rounded-lg border border-border">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Sync Active</span>
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard
          title="Fleet Utilization"
          value={`${kpis.fleetUtilization}%`}
          subtitle={`Active & Available Vehicles`}
          icon={Bus}
          trend={{ value: 3.2, label: 'vs last week', positive: true }}
          iconColor="text-indigo-400"
          iconBg="bg-indigo-500/10"
          delay={0}
        />
        <StatCard
          title="Active Vehicles"
          value={String(kpis.activeVehicles)}
          subtitle={`${kpis.availableVehicles} available | ${kpis.maintenanceVehicles} maintenance`}
          icon={Activity}
          trend={{ value: 2, label: 'vehicles dispatching', positive: true }}
          iconColor="text-sky-400"
          iconBg="bg-sky-500/10"
          delay={0.05}
        />
        <StatCard
          title="Active Trips"
          value={String(kpis.activeTrips)}
          subtitle={`${kpis.pendingTrips} pending dispatches`}
          icon={Navigation}
          trend={{ value: 15.4, label: 'vs yesterday', positive: true }}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          delay={0.1}
        />
        <StatCard
          title="Drivers On Duty"
          value={String(kpis.driversOnDuty)}
          subtitle={`of ${kpis.totalDrivers} total active drivers`}
          icon={Users}
          trend={{ value: 5, label: 'vs last shift', positive: true }}
          iconColor="text-violet-400"
          iconBg="bg-violet-500/10"
          delay={0.15}
        />

        {/* Finance KPIs - display conditionally based on user permission */}
        {canSeeFinance && (
          <>
            <StatCard
              title="Revenue Today"
              value={`$${kpis.revenue.toLocaleString()}`}
              subtitle="All contract payments"
              icon={TrendingUp}
              trend={{ value: 8.5, label: 'vs target', positive: true }}
              iconColor="text-emerald-400"
              iconBg="bg-emerald-500/10"
              delay={0.2}
            />
            <StatCard
              title="Total Operating Expense"
              value={`$${kpis.expense.toLocaleString()}`}
              subtitle={`Net profit: $${kpis.netProfit.toLocaleString()}`}
              icon={DollarSign}
              trend={{ value: -12.4, label: 'cost efficiency', positive: true }}
              iconColor="text-rose-400"
              iconBg="bg-rose-500/10"
              delay={0.25}
            />
          </>
        )}

        {/* Fuel KPIs - conditionally rendered */}
        {canSeeFuel && (
          <StatCard
            title="Fuel Costs"
            value={`$${kpis.fuelCost.toLocaleString()}`}
            subtitle="Recent refueling audits"
            icon={Flame}
            trend={{ value: -2.3, label: 'fuel consumption', positive: true }}
            iconColor="text-amber-400"
            iconBg="bg-amber-500/10"
            delay={0.3}
          />
        )}
      </div>

      {/* Grid: Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Trends - Area Chart */}
        {canSeeFinance && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-base font-semibold">Revenue vs Expense Trend</CardTitle>
                  <CardDescription>Monthly billing comparisons and expense margins</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.areaChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                      <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" name="Expense" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Fleet Distribution - Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className={canSeeFinance ? '' : 'lg:col-span-3'}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Fleet Allocation</CardTitle>
              <CardDescription>Current vehicle allocation and operational status</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.pieChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {charts.pieChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full mt-4">
                {charts.pieChart.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                    <span className="text-xs font-bold ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fuel Consumption Trend - Bar Chart */}
        {canSeeFuel && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Fuel Expenses & Consumption</CardTitle>
                <CardDescription>Liters supplied vs fuel transaction totals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.barChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="cost" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Cost ($)" />
                      <Bar dataKey="liters" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Liters" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Trips Completion - Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className={canSeeFuel ? 'lg:col-span-1' : 'lg:col-span-3'}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Trips Analytics</CardTitle>
              <CardDescription>Daily completed vs active trips</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.lineChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
                    <Line type="monotone" dataKey="active" stroke="#3b82f6" strokeWidth={2} name="Active" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Operational Section: Timeline and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Activity Logs & Audit Timeline</CardTitle>
              <CardDescription>Real-time operational events and security auditing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative border-l border-border pl-6 space-y-6">
                {activity.map((item) => (
                  <div key={item.id} className="relative">
                    {/* Circle icon */}
                    <span className="absolute -left-[31px] top-0 flex items-center justify-center w-5 h-5 rounded-full bg-background border border-border">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </span>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{item.title}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                      {item.user && (
                        <span className="text-[10px] font-medium text-primary/80">Triggered by: {item.user}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
              <CardDescription>Common operations tasks</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button className="w-full gap-2 justify-start py-6" variant="outline">
                <Play className="h-4 w-4 text-emerald-500" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Dispatch Trip</p>
                  <p className="text-xs text-muted-foreground">Assign vehicle and driver to route</p>
                </div>
              </Button>
              <Button className="w-full gap-2 justify-start py-6" variant="outline">
                <Flame className="h-4 w-4 text-amber-500" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Log Refueling</p>
                  <p className="text-xs text-muted-foreground">Log fuel purchase for audits</p>
                </div>
              </Button>
              <Button className="w-full gap-2 justify-start py-6" variant="outline">
                <AlertCircle className="h-4 w-4 text-indigo-500" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Schedule Maintenance</p>
                  <p className="text-xs text-muted-foreground">Send vehicle to maintenance workshop</p>
                </div>
              </Button>
              <Button className="w-full gap-2 justify-start py-6" variant="outline">
                <Plus className="h-4 w-4 text-sky-500" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Create Route</p>
                  <p className="text-xs text-muted-foreground">Add a new transit route map</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
