import api from '@/lib/axios';

export type FuelLogStatus = string;

export interface VehicleRef {
  id: string;
  plateNumber: string;
  model: string;
  type: string;
  status: string;
}

export interface DriverRef {
  id: string;
  firstName: string;
  lastName: string;
}

export interface TripRef {
  id: string;
  status: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  tripId: string | null;
  driverId: string;
  userId: string | null;
  fuelType: string;
  liters: number;
  cost: number;
  odometer: number;
  loggedAt: string;
  vehicle: VehicleRef;
  driver: DriverRef;
  trip: TripRef | null;
}

export interface FuelStats {
  total: number;
  thisMonth: number;
  totalCost: number;
  totalLiters: number;
  monthlyCost: number;
  monthlyLiters: number;
  topVehicles: {
    vehicle: { id: string; plateNumber: string; model: string };
    totalCost: number;
    totalLiters: number;
    count: number;
  }[];
  monthlyTrend: { month: string; cost: number; liters: number }[];
}

export interface GetFuelParams {
  page?: number;
  limit?: number;
  vehicleId?: string;
  driverId?: string;
}

export const fuelApi = {
  getAll: async (params?: GetFuelParams) => {
    const { data } = await api.get('/fuel', { params });
    return { data: data.data, meta: data.meta };
  },

  getStats: async () => {
    const { data } = await api.get('/fuel/statistics');
    return data.data as FuelStats;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/fuel/${id}`);
    return data.data as FuelLog;
  },

  create: async (payload: {
    vehicleId: string;
    tripId?: string | null;
    driverId: string;
    fuelType: string;
    liters: number;
    cost: number;
    odometer: number;
    loggedAt?: string;
  }) => {
    const { data } = await api.post('/fuel', payload);
    return data.data as FuelLog;
  },

  update: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.put(`/fuel/${id}`, payload);
    return data.data as FuelLog;
  },

  delete: async (id: string) => {
    await api.delete(`/fuel/${id}`);
    return true;
  }
};
