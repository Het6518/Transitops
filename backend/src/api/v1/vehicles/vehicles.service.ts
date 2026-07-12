import { VehiclesRepository } from './vehicles.repository';
import { CreateVehicleInput, UpdateVehicleInput } from './vehicles.validation';
import { VehicleStatus } from '@prisma/client';

export class VehiclesService {
  private repository = new VehiclesRepository();

  // Valid state transitions mapping
  private static VALID_TRANSITIONS: Record<VehicleStatus, VehicleStatus[]> = {
    [VehicleStatus.AVAILABLE]: [VehicleStatus.ON_TRIP, VehicleStatus.IN_SHOP, VehicleStatus.RETIRED],
    [VehicleStatus.ON_TRIP]: [VehicleStatus.AVAILABLE, VehicleStatus.IN_SHOP],
    [VehicleStatus.IN_SHOP]: [VehicleStatus.AVAILABLE, VehicleStatus.RETIRED],
    [VehicleStatus.RETIRED]: [], // Retired is terminal state
  };

  async getVehicles(params: {
    search?: string;
    status?: VehicleStatus;
    type?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    return this.repository.findMany({ ...params, page, limit });
  }

  async getVehicleById(id: string) {
    const vehicle = await this.repository.findById(id);
    if (!vehicle) {
      throw new Error(`Vehicle with ID ${id} not found`);
    }
    return vehicle;
  }

  async createVehicle(data: CreateVehicleInput) {
    // 1. Prevent duplicate registration plate numbers
    const existing = await this.repository.findByPlateNumber(data.plateNumber);
    if (existing) {
      throw new Error(`Vehicle with plate number "${data.plateNumber}" already exists`);
    }

    return this.repository.create(data);
  }

  async updateVehicle(id: string, data: UpdateVehicleInput) {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new Error(`Vehicle with ID ${id} not found`);
    }

    // 1. Prevent duplicate registration plate numbers if changing plate
    if (data.plateNumber && data.plateNumber !== current.plateNumber) {
      const existing = await this.repository.findByPlateNumber(data.plateNumber);
      if (existing) {
        throw new Error(`Vehicle with plate number "${data.plateNumber}" already exists`);
      }
    }

    // 2. Prevent invalid status transitions
    if (data.status && data.status !== current.status) {
      const allowed = VehiclesService.VALID_TRANSITIONS[current.status];
      if (!allowed.includes(data.status)) {
        throw new Error(
          `Invalid status transition: Cannot transition vehicle status from ${current.status} to ${data.status}`
        );
      }
    }

    return this.repository.update(id, data);
  }

  async deleteVehicle(id: string) {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new Error(`Vehicle with ID ${id} not found`);
    }

    // Prevent deleting active/on-trip vehicles
    if (current.status === VehicleStatus.ON_TRIP) {
      throw new Error('Cannot delete a vehicle while it is currently active on a trip.');
    }

    return this.repository.delete(id);
  }
}
