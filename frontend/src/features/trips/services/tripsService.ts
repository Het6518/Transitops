import api from '@/lib/axios';

export type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  userId?: string;
  routeId: string;
  status: TripStatus;
  cargoWeight: number;
  cargoDescription: string;
  estimatedCost: number;
  estimatedFuel: number;
  startTime?: string;
  endTime?: string;
  actualDistance?: number;
  createdAt: string;
  updatedAt: string;
  vehicle: {
    plateNumber: string;
    model: string;
    type: string;
  };
  driver: {
    firstName: string;
    lastName: string;
    licenseNumber: string;
  };
  route: {
    name: string;
    distance: number;
    startLocation: string;
    endLocation: string;
  };
}

export interface TripStatistics {
  totalTrips: number;
  draftCount: number;
  dispatchedCount: number;
  completedCount: number;
  cancelledCount: number;
  totalCost: number;
  totalFuel: number;
  totalDistance: number;
}

export interface GetTripsParams {
  search?: string;
  status?: TripStatus;
  vehicleId?: string;
  driverId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedTrips {
  items: Trip[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const tripsService = {
  getTrips: async (params?: GetTripsParams): Promise<PaginatedTrips> => {
    const response = await api.get('/trips', { params });
    return {
      items: response.data.data,
      total: response.data.meta?.total || response.data.data.length,
      page: response.data.meta?.page || 1,
      limit: response.data.meta?.limit || 10,
      totalPages: response.data.meta?.totalPages || 1,
    };
  },

  getTripById: async (id: string): Promise<Trip> => {
    const response = await api.get(`/trips/${id}`);
    return response.data.data;
  },

  getStatistics: async (): Promise<TripStatistics> => {
    const response = await api.get('/trips/statistics');
    return response.data.data;
  },

  createTrip: async (data: {
    vehicleId: string;
    driverId: string;
    routeId: string;
    cargoWeight: number;
    cargoDescription: string;
    estimatedCost?: number;
    estimatedFuel?: number;
  }): Promise<Trip> => {
    const response = await api.post('/trips', data);
    return response.data.data;
  },

  updateTrip: async (id: string, data: Partial<Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Trip> => {
    const response = await api.put(`/trips/${id}`, data);
    return response.data.data;
  },

  dispatchTrip: async (id: string): Promise<Trip> => {
    const response = await api.post(`/trips/${id}/dispatch`);
    return response.data.data;
  },

  completeTrip: async (id: string, actualDistance?: number): Promise<Trip> => {
    const response = await api.post(`/trips/${id}/complete`, { actualDistance });
    return response.data.data;
  },

  cancelTrip: async (id: string): Promise<Trip> => {
    const response = await api.post(`/trips/${id}/cancel`);
    return response.data.data;
  },

  deleteTrip: async (id: string): Promise<void> => {
    await api.delete(`/trips/${id}`);
  },
};
