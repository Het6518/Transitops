import api from '@/lib/axios';

export interface KPIStats {
  fleetUtilization: number;
  activeVehicles: number;
  availableVehicles: number;
  maintenanceVehicles: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  totalDrivers: number;
  fuelCost: number;
  revenue: number;
  expense: number;
  netProfit: number;
}

export interface ActivityTimelineItem {
  id: string;
  type: 'TRIP' | 'MAINTENANCE' | 'SYSTEM' | 'AUTH';
  title: string;
  description: string;
  status?: string;
  timestamp: string;
  user?: string;
}

export interface ChartData {
  pieChart: Array<{ name: string; value: number; color: string }>;
  areaChart: Array<{ name: string; revenue: number; expense: number }>;
  barChart: Array<{ name: string; cost: number; liters: number }>;
  lineChart: Array<{ name: string; completed: number; active: number }>;
}

export interface DashboardSummary {
  kpis: KPIStats;
  activity: ActivityTimelineItem[];
  charts: ChartData;
}

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get('/dashboard');
    return response.data.data;
  },

  getKPIs: async (): Promise<KPIStats> => {
    const response = await api.get('/dashboard/kpis');
    return response.data.data;
  },

  getActivity: async (): Promise<ActivityTimelineItem[]> => {
    const response = await api.get('/dashboard/activity');
    return response.data.data;
  },

  getCharts: async (): Promise<ChartData> => {
    const response = await api.get('/dashboard/charts');
    return response.data.data;
  },
};
