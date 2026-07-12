import { motion } from 'framer-motion';
import {
  Bus,
  Users,
  Navigation,
  TrendingUp,
  Activity,
  Clock,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
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
  Legend,
} from 'recharts';
import { formatDate } from '@/lib/utils';

// ── Mock data (will be replaced by API calls) ────────────────────────────────
const tripTrend = [
  { day: 'Mon', trips: 42, revenue: 8200 },
  { day: 'Tue', trips: 55, revenue: 10500 },
  { day: 'Wed', trips: 48, revenue: 9100 },
  { day: 'Thu', trips: 63, revenue: 12400 },
  { day: 'Fri', trips: 71, revenue: 14200 },
  { day: 'Sat', trips: 38, revenue: 7300 },
  { day: 'Sun', trips: 29, revenue: 5600 },
];

const fleetStatus = [
  { name: 'Active', value: 34, color: '#22c55e' },
  { name: 'Idle', value: 12, color: '#6366f1' },
  { name: 'Maintenance', value: 5, color: '#f59e0b' },
  { name: 'Offline', value: 3, color: '#ef4444' },
];

const recentTrips = [
  { id: 'T-1201', route: 'Central → Airport', driver: 'James Wilson', status: 'Active', time: '09:45 AM' },
  { id: 'T-1200', route: 'Harbor → Uptown', driver: 'Sarah Chen', status: 'Completed', time: '09:12 AM' },
  { id: 'T-1199', route: 'Stadium → Mall', driver: 'Mike Torres', status: 'Active', time: '08:55 AM' },
  { id: 'T-1198', route: 'University → Station', driver: 'Emily Park', status: 'Completed', time: '08:30 AM' },
  { id: 'T-1197', route: 'Suburb → City', driver: 'David Kim', status: 'Delayed', time: '08:10 AM' },
];

const STATUS_COLORS: Record<string, 'success' | 'info' | 'warning' | 'destructive' | 'secondary'> = {
  Active: 'success',
  Completed: 'secondary',
  Delayed: 'warning',
  Cancelled: 'destructive',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const today = formatDate(new Date());

  return (
    <div className="page-wrapper">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Good morning, {user?.firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {today} — Here's what's happening with your fleet today.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
          <Activity className="h-3.5 w-3.5 text-success" />
          <span>Live — Updated just now</span>
        </div>
      </div>

      {/* ── KPI Stats ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Active Vehicles"
          value="34"
          subtitle="of 54 total fleet"
          icon={Bus}
          trend={{ value: 12, label: 'vs yesterday', positive: true }}
          iconColor="text-indigo-400"
          iconBg="bg-indigo-500/10"
          delay={0}
        />
        <StatCard
          title="Drivers On Duty"
          value="28"
          subtitle="6 on break"
          icon={Users}
          trend={{ value: 4, label: 'vs yesterday', positive: true }}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          delay={0.05}
        />
        <StatCard
          title="Trips Today"
          value="127"
          subtitle="18 currently active"
          icon={Navigation}
          trend={{ value: 8, label: 'vs yesterday', positive: true }}
          iconColor="text-violet-400"
          iconBg="bg-violet-500/10"
          delay={0.1}
        />
        <StatCard
          title="Revenue Today"
          value="$24,890"
          subtitle="Target: $30,000"
          icon={TrendingUp}
          trend={{ value: -3, label: 'vs yesterday', positive: false }}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
          delay={0.15}
        />
      </div>

      {/* ── Charts Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trip trends area chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Trip & Revenue Trends</CardTitle>
              <CardDescription>Last 7 days performance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={tripTrend} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="tripsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="trips"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                  />
                  <Area
                    yAxisId="trips"
                    type="monotone"
                    dataKey="trips"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#tripsGrad)"
                    name="Trips"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Fleet status pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle>Fleet Status</CardTitle>
              <CardDescription>Current vehicle distribution</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={fleetStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {fleetStatus.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full mt-2">
                {fleetStatus.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-semibold ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Recent Trips Table ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Recent Trips</CardTitle>
              <CardDescription>Latest trip activity across all routes</CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">Live</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trip ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentTrips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">{trip.id}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                          <span className="font-medium text-sm truncate max-w-[180px]">{trip.route}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 hidden md:table-cell text-muted-foreground text-xs">{trip.driver}</td>
                      <td className="px-6 py-3.5 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                          <Clock className="h-3 w-3" />
                          {trip.time}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge
                          variant={STATUS_COLORS[trip.status] ?? 'secondary'}
                          dot
                          className="text-[11px]"
                        >
                          {trip.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
