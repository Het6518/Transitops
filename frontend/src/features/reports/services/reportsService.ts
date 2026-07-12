import api from '@/lib/axios';

export interface OverviewReport {
  vehicles: number;
  drivers: number;
  trips: number;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface FleetReport {
  totalVehicles: number;
  utilizationRate: number;
  statuses: { status: string; count: number }[];
  maintenanceCostByVehicle: { vehicleId: string; cost: number; count: number }[];
}

export interface ExpenseReportCategory {
  category: string;
  amount: number;
  count: number;
}

export interface FuelReport {
  totalCost: number;
  totalLiters: number;
  byVehicle: { vehicleId: string; cost: number; liters: number; count: number }[];
}

export interface DriverReportItem {
  driverId: string;
  name: string;
  safetyScore: number;
  tripsCount: number;
  totalDistance: number;
}

export interface TripReport {
  statusBreakdown: { status: string; count: number }[];
  averageDistance: number;
  totalDistance: number;
}

export const reportsApi = {
  getOverview: async () => {
    const { data } = await api.get('/reports');
    return data.data as OverviewReport;
  },

  getFleet: async () => {
    const { data } = await api.get('/reports/fleet');
    return data.data as FleetReport;
  },

  getExpenses: async () => {
    const { data } = await api.get('/reports/expenses');
    return data.data as ExpenseReportCategory[];
  },

  getFuel: async () => {
    const { data } = await api.get('/reports/fuel');
    return data.data as FuelReport;
  },

  getDrivers: async () => {
    const { data } = await api.get('/reports/drivers');
    return data.data as DriverReportItem[];
  },

  getTrips: async () => {
    const { data } = await api.get('/reports/trips');
    return data.data as TripReport;
  },

  exportCSV: () => {
    // Navigate directly to trigger browser file download with auth cookies
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    window.open(`${baseUrl}/reports/export/csv`, '_blank');
  },

  exportPDF: async () => {
    const { data } = await api.get('/reports/export/pdf');
    return data.data;
  }
};
