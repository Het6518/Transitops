import api from '@/lib/axios';

export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  status: DriverStatus;
  safetyScore: number;
  address?: string;
  avatar?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  trips?: Array<{
    id: string;
    status: string;
    createdAt: string;
    startTime?: string;
    endTime?: string;
    vehicle: { plateNumber: string; model: string };
    route: { name: string; startLocation: string; endLocation: string };
  }>;
}

export interface DriverStatistics {
  total: number;
  available: number;
  onTrip: number;
  offDuty: number;
  suspended: number;
  expiringSoon: number;
  averageSafetyScore: number;
}

export interface GetDriversParams {
  search?: string;
  status?: DriverStatus;
  licenseCategory?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedDrivers {
  items: Driver[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type CreateDriverInput = {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  safetyScore?: number;
  address?: string;
  notes?: string;
};

export type UpdateDriverInput = Partial<CreateDriverInput & { status: DriverStatus }>;

export const driversService = {
  getDrivers: async (params?: GetDriversParams): Promise<PaginatedDrivers> => {
    const response = await api.get('/drivers', { params });
    const meta = response.data.meta;
    return {
      items: response.data.data,
      total: meta?.total || response.data.data.length,
      page: meta?.page || 1,
      limit: meta?.limit || 10,
      totalPages: meta?.totalPages || 1,
    };
  },

  getDriverById: async (id: string): Promise<Driver> => {
    const response = await api.get(`/drivers/${id}`);
    return response.data.data;
  },

  getAvailableDrivers: async (): Promise<Driver[]> => {
    const response = await api.get('/drivers/available');
    return response.data.data;
  },

  getStatistics: async (): Promise<DriverStatistics> => {
    const response = await api.get('/drivers/statistics');
    return response.data.data;
  },

  createDriver: async (data: CreateDriverInput): Promise<Driver> => {
    const response = await api.post('/drivers', data);
    return response.data.data;
  },

  updateDriver: async (id: string, data: UpdateDriverInput): Promise<Driver> => {
    const response = await api.put(`/drivers/${id}`, data);
    return response.data.data;
  },

  deleteDriver: async (id: string): Promise<void> => {
    await api.delete(`/drivers/${id}`);
  },
};
