import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Calendar,
  Users,
  Compass,
  FileText,
  AlertTriangle,
  RefreshCw,
  Wrench,
  Gauge
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  useReportsOverview,
  useReportsFleet,
  useReportsExpenses,
  useReportsFuel,
  useReportsDrivers,
  useReportsTrips
} from '../hooks/useReports';
import { reportsApi } from '../services/reportsService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageLoader } from '@/components/common/PageLoader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: overview, isLoading: oLoading } = useReportsOverview();
  const { data: fleet, isLoading: fLoading } = useReportsFleet();
  const { data: expenses, isLoading: eLoading } = useReportsExpenses();
  const { data: fuel, isLoading: fuLoading } = useReportsFuel();
  const { data: drivers, isLoading: dLoading } = useReportsDrivers();
  const { data: trips, isLoading: tLoading } = useReportsTrips();

  const handleExportCSV = () => {
    reportsApi.exportCSV();
  };

  if (oLoading || fLoading || eLoading || fuLoading || dLoading || tLoading) {
    return <PageLoader />;
  }

  // Financial breakdown
  const financialData = [
    { name: 'Revenue', value: overview?.revenue || 0 },
    { name: 'Expenses', value: overview?.expenses || 0 },
    { name: 'Net Profit', value: overview?.profit || 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Executive overview of fleet ROI, cost centers, and driver metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[480px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fleet">Fleet & ROI</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="drivers">Drivers & Trips</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Estimated Revenue</p>
                  <p className="text-3xl font-bold text-emerald-500">${overview?.revenue?.toLocaleString() || 0}</p>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Operational Costs</p>
                  <p className="text-3xl font-bold text-red-500">${overview?.expenses?.toLocaleString() || 0}</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-xl">
                  <TrendingDown className="h-6 w-6 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Net Operations Income</p>
                  <p className="text-3xl font-bold text-blue-500">${overview?.profit?.toLocaleString() || 0}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <DollarSign className="h-6 w-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>Comparison of revenue vs costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Insights</CardTitle>
                <CardDescription>Operational highlights and stats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center border-b pb-3">
                  <div className="flex items-center gap-3">
                    <Compass className="text-muted-foreground h-5 w-5" />
                    <div>
                      <p className="font-semibold text-sm">Total Active Trips</p>
                      <p className="text-xs text-muted-foreground">Cumulative dispatched trips</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold">{overview?.trips || 0}</span>
                </div>

                <div className="flex justify-between items-center border-b pb-3">
                  <div className="flex items-center gap-3">
                    <Users className="text-muted-foreground h-5 w-5" />
                    <div>
                      <p className="font-semibold text-sm">Managed Fleet Drivers</p>
                      <p className="text-xs text-muted-foreground">Registered and active operators</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold">{overview?.drivers || 0}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Gauge className="text-muted-foreground h-5 w-5" />
                    <div>
                      <p className="font-semibold text-sm">Fleet Capacity Size</p>
                      <p className="text-xs text-muted-foreground">Total registered trucks/vans</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold">{overview?.vehicles || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Fleet & ROI */}
        <TabsContent value="fleet" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Fleet Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fleet?.statuses.map(s => ({ name: s.status, value: s.count })) || []}
                        cx="50%" cy="50%" outerRadius={80} paddingAngle={2} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {fleet?.statuses.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fleet Utilization Rate</CardTitle>
                <CardDescription>Current ratio of in-use vs idle vehicles</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col justify-center items-center h-[250px]">
                <div className="text-6xl font-bold text-primary mb-2">{fleet?.utilizationRate || 0}%</div>
                <p className="text-muted-foreground text-sm text-center max-w-[280px]">
                  An optimized fleet targets 60-80% utilization. Higher may indicate capacity constraints; lower indicates idle capital.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Financials */}
        <TabsContent value="financials" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Operational Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenses?.map(e => ({ name: e.category, value: e.amount })) || []}
                        cx="50%" cy="50%" outerRadius={80} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {expenses?.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fuel Consumption Metrics</CardTitle>
                <CardDescription>Aggregate fuel efficiency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted/30 border rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Total Liters Refueled</p>
                    <p className="text-xs text-muted-foreground">Liters consumed in tracked operations</p>
                  </div>
                  <span className="text-2xl font-bold">{fuel?.totalLiters?.toLocaleString(undefined, { maximumFractionDigits: 1 }) || 0}L</span>
                </div>

                <div className="p-4 bg-muted/30 border rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Total Fuel Cost</p>
                    <p className="text-xs text-muted-foreground">Cumulative direct fuel expense</p>
                  </div>
                  <span className="text-2xl font-bold text-amber-500">${fuel?.totalCost?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Drivers & Trips */}
        <TabsContent value="drivers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Drivers Performance</CardTitle>
                <CardDescription>Safety Score vs Completed Trips count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {drivers?.slice(0, 5).map((d) => (
                    <div key={d.driverId} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-semibold text-sm">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.totalDistance.toFixed(0)} km traversed</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold block">{d.tripsCount} trips</span>
                        <span className="text-xs font-semibold text-emerald-500">Score: {d.safetyScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trip Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trips?.statusBreakdown.map(s => ({ name: s.status, count: s.count })) || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
