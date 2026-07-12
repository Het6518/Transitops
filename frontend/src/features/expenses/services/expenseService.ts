import api from '@/lib/axios';

export interface VehicleRef {
  id: string;
  plateNumber: string;
  model: string;
  type: string;
  status: string;
}

export interface TripRef {
  id: string;
  status: string;
}

export interface Expense {
  id: string;
  vehicleId: string;
  tripId: string | null;
  category: string;
  amount: number;
  date: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle: VehicleRef;
  trip: TripRef | null;
}

export interface ExpenseStats {
  total: number;
  thisMonth: number;
  totalAmount: number;
  monthlyAmount: number;
  categoryBreakdown: { category: string; amount: number; count: number }[];
  topVehicles: {
    vehicle: { id: string; plateNumber: string; model: string };
    totalAmount: number;
    count: number;
  }[];
  monthlyTrend: { month: string; amount: number }[];
}

export interface GetExpenseParams {
  page?: number;
  limit?: number;
  vehicleId?: string;
  category?: string;
}

export const expenseApi = {
  getAll: async (params?: GetExpenseParams) => {
    const { data } = await api.get('/expenses', { params });
    return { data: data.data, meta: data.meta };
  },

  getStats: async () => {
    const { data } = await api.get('/expenses/statistics');
    return data.data as ExpenseStats;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/expenses/${id}`);
    return data.data as Expense;
  },

  create: async (payload: {
    vehicleId: string;
    tripId?: string | null;
    category: string;
    amount: number;
    date?: string;
    description?: string | null;
  }) => {
    const { data } = await api.post('/expenses', payload);
    return data.data as Expense;
  },

  update: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.put(`/expenses/${id}`, payload);
    return data.data as Expense;
  },

  delete: async (id: string) => {
    await api.delete(`/expenses/${id}`);
    return true;
  }
};
