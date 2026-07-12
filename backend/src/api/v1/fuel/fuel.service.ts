import { FuelRepository } from './fuel.repository';
import { Prisma } from '@prisma/client';

export class FuelService {
  private repo = new FuelRepository();

  async getFuelLogs(params: {
    page: number;
    limit: number;
    vehicleId?: string;
    driverId?: string;
  }) {
    const skip = (params.page - 1) * params.limit;
    const where: Prisma.FuelLogWhereInput = {};
    if (params.vehicleId) where.vehicleId = params.vehicleId;
    if (params.driverId) where.driverId = params.driverId;

    const { data, total } = await this.repo.findAll({
      skip,
      take: params.limit,
      where,
      orderBy: { loggedAt: 'desc' }
    });

    return {
      data,
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
        hasNext: params.page < Math.ceil(total / params.limit),
        hasPrev: params.page > 1
      }
    };
  }

  async getFuelLogById(id: string) {
    const record = await this.repo.findById(id);
    if (!record) throw new Error('Fuel log not found');
    return record;
  }

  async getStatistics() {
    return this.repo.getStatistics();
  }

  async createFuelLog(data: {
    vehicleId: string;
    tripId?: string | null;
    driverId: string;
    fuelType: string;
    liters: number;
    cost: number;
    odometer: number;
    loggedAt?: string;
    userId: string;
  }) {
    return this.repo.create({
      vehicle: { connect: { id: data.vehicleId } },
      trip: data.tripId ? { connect: { id: data.tripId } } : undefined,
      driver: { connect: { id: data.driverId } },
      user: { connect: { id: data.userId } },
      fuelType: data.fuelType,
      liters: data.liters,
      cost: data.cost,
      odometer: data.odometer,
      loggedAt: data.loggedAt ? new Date(data.loggedAt) : new Date()
    });
  }

  async updateFuelLog(id: string, data: {
    vehicleId?: string;
    tripId?: string | null;
    driverId?: string;
    fuelType?: string;
    liters?: number;
    cost?: number;
    odometer?: number;
    loggedAt?: string;
  }) {
    const updateData: Prisma.FuelLogUpdateInput = {};
    if (data.vehicleId) updateData.vehicle = { connect: { id: data.vehicleId } };
    if (data.tripId !== undefined) {
      updateData.trip = data.tripId ? { connect: { id: data.tripId } } : { disconnect: true };
    }
    if (data.driverId) updateData.driver = { connect: { id: data.driverId } };
    if (data.fuelType !== undefined) updateData.fuelType = data.fuelType;
    if (data.liters !== undefined) updateData.liters = data.liters;
    if (data.cost !== undefined) updateData.cost = data.cost;
    if (data.odometer !== undefined) updateData.odometer = data.odometer;
    if (data.loggedAt) updateData.loggedAt = new Date(data.loggedAt);

    return this.repo.update(id, updateData);
  }

  async deleteFuelLog(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new Error('Fuel log not found');
    await this.repo.delete(id);
    return true;
  }
}
