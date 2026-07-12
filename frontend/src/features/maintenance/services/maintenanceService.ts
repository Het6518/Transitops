import api from '@/lib/axios';
export type VehicleStatus = 'AVAILABLE' | 'IN_USE' | 'IN_SHOP' | 'RETIRED';
export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface VehicleRef {
  id: string;
  plateNumber: string;
  model: string;
  type: string;
  status: VehicleStatus;
}

export interface UserRef {
  id: string;
  firstName: string;
  lastName: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  serviceType: string;
  description: string;
  cost: number;
  status: MaintenanceStatus;
  startDate: string;
  endDate: string | null;
  createdById: string | null;
  completedById: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle: VehicleRef;
  createdBy: UserRef | null;
  completedBy: UserRef | null;
}

export interface MaintenanceStats {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  monthlyCost: number;
}

export interface GetMaintenanceParams {
  page?: number;
  limit?: number;
  status?: string;
  vehicleId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const maintenanceApi = {
  getAll: async (params?: GetMaintenanceParams) => {
    const { data } = await api.get<{ data: PaginatedResponse<MaintenanceRecord> }>('/maintenance', { params });
    return data.data;
  },

  getStats: async () => {
    const { data } = await api.get<{ data: MaintenanceStats }>('/maintenance/statistics');
    return data.data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<{ data: MaintenanceRecord }>(`/maintenance/${id}`);
    return data.data;
  },

  create: async (payload: {
    vehicleId: string;
    serviceType: string;
    description: string;
    cost: number;
    status?: MaintenanceStatus;
    startDate: string;
    endDate?: string | null;
  }) => {
    const { data } = await api.post<{ data: MaintenanceRecord }>('/maintenance', payload);
    return data.data;
  },

  update: async (id: string, payload: {
    serviceType?: string;
    description?: string;
    cost?: number;
    status?: MaintenanceStatus;
    startDate?: string;
    endDate?: string | null;
  }) => {
    const { data } = await api.put<{ data: MaintenanceRecord }>(`/maintenance/${id}`, payload);
    return data.data;
  },

  complete: async (id: string) => {
    const { data } = await api.post<{ data: MaintenanceRecord }>(`/maintenance/${id}/complete`);
    return data.data;
  },

  delete: async (id: string) => {
    await api.delete(`/maintenance/${id}`);
    return true;
  }
};
