import api from '@/lib/axios';

export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';

export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  type: string;
  status: VehicleStatus;
  fuelType: string;
  fuelCapacity: number;
  mileage: number;
  createdAt: string;
  updatedAt: string;
  trips?: Array<{
    id: string;
    status: string;
    createdAt: string;
    driver: { firstName: string; lastName: string };
    route: { name: string };
  }>;
  maintenances?: Array<{
    id: string;
    description: string;
    cost: number;
    status: string;
    startDate: string;
    endDate?: string;
  }>;
}

export interface GetVehiclesParams {
  search?: string;
  status?: VehicleStatus;
  type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedVehicles {
  items: Vehicle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const fleetService = {
  getVehicles: async (params?: GetVehiclesParams): Promise<PaginatedVehicles> => {
    const response = await api.get('/vehicles', { params });
    return {
      items: response.data.data,
      total: response.data.meta?.total || response.data.data.length,
      page: response.data.meta?.page || 1,
      limit: response.data.meta?.limit || 10,
      totalPages: response.data.meta?.totalPages || 1,
    };
  },

  getVehicleById: async (id: string): Promise<Vehicle> => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data.data;
  },

  createVehicle: async (data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> => {
    const response = await api.post('/vehicles', data);
    return response.data.data;
  },

  updateVehicle: async (id: string, data: Partial<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Vehicle> => {
    const response = await api.put(`/vehicles/${id}`, data);
    return response.data.data;
  },

  deleteVehicle: async (id: string): Promise<void> => {
    await api.delete(`/vehicles/${id}`);
  },
};
