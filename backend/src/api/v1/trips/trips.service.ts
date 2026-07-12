import { TripsRepository } from './trips.repository';
import { CreateTripInput, UpdateTripInput } from './trips.validation';
import { prisma } from '../../../config/database';
import { TripStatus, VehicleStatus, DriverStatus } from '@prisma/client';

const VEHICLE_CAPACITIES: Record<string, number> = {
  Bus: 1000,
  Van: 2500,
  Truck: 18000,
};

export class TripsService {
  private repository = new TripsRepository();

  async getTrips(params: {
    search?: string;
    status?: TripStatus;
    vehicleId?: string;
    driverId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    return this.repository.findMany({ ...params, page, limit });
  }

  async getTripById(id: string) {
    const trip = await this.repository.findById(id);
    if (!trip) {
      throw new Error(`Trip with ID ${id} not found`);
    }
    return trip;
  }

  async getStatistics() {
    return this.repository.getStatistics();
  }

  async createTrip(data: CreateTripInput & { userId?: string }) {
    // Basic verification of existence
    const [vehicle, driver, route] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id: data.vehicleId } }),
      prisma.driver.findUnique({ where: { id: data.driverId } }),
      prisma.route.findUnique({ where: { id: data.routeId } }),
    ]);

    if (!vehicle) throw new Error('Selected vehicle does not exist.');
    if (!driver) throw new Error('Selected driver does not exist.');
    if (!route) throw new Error('Selected route does not exist.');

    // Auto-calculate cost/fuel estimators if not supplied
    if (!data.estimatedCost) {
      data.estimatedCost = Math.round((route.distance * 1.6 + 25) * 100) / 100;
    }
    if (!data.estimatedFuel) {
      data.estimatedFuel = Math.round((route.distance * 0.18 + 3) * 10) / 10;
    }

    return this.repository.create(data);
  }

  async updateTrip(id: string, data: UpdateTripInput) {
    const current = await this.repository.findById(id);
    if (!current) throw new Error(`Trip with ID ${id} not found`);

    if (current.status !== TripStatus.DRAFT) {
      throw new Error('Only draft trips can have their specifications modified.');
    }

    return this.repository.update(id, data);
  }

  async dispatchTrip(id: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch trip details inside transaction context
      const trip = await tx.trip.findUnique({
        where: { id },
        include: { vehicle: true, driver: true },
      });

      if (!trip) throw new Error('Trip not found');
      if (trip.status !== TripStatus.DRAFT) throw new Error('Only Draft trips can be dispatched');

      const vehicle = trip.vehicle;
      const driver = trip.driver;

      // 2. Validate Business Rules
      if (vehicle.status !== VehicleStatus.AVAILABLE) {
        throw new Error(`Vehicle is not available. Current status: ${vehicle.status}`);
      }

      if (driver.status !== DriverStatus.AVAILABLE) {
        if (driver.status === DriverStatus.SUSPENDED) {
          throw new Error('Cannot assign a suspended driver to a trip');
        }
        throw new Error(`Driver is not available. Current status: ${driver.status}`);
      }

      if (new Date(driver.licenseExpiry) < new Date()) {
        throw new Error('Cannot assign driver: License is expired');
      }

      const limit = VEHICLE_CAPACITIES[vehicle.type] || 3000;
      if (trip.cargoWeight && trip.cargoWeight > limit) {
        throw new Error(`Cargo weight (${trip.cargoWeight} kg) exceeds vehicle type capacity (${limit} kg)`);
      }

      // 3. Perform atomic state updates
      const updatedTrip = await tx.trip.update({
        where: { id },
        data: {
          status: TripStatus.DISPATCHED,
          startTime: new Date(),
        },
      });

      await tx.vehicle.update({
        where: { id: vehicle.id },
        data: { status: VehicleStatus.ON_TRIP },
      });

      await tx.driver.update({
        where: { id: driver.id },
        data: { status: DriverStatus.ON_TRIP },
      });

      return updatedTrip;
    });
  }

  async completeTrip(id: string, actualDistance?: number) {
    return prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({
        where: { id },
        include: { route: true },
      });

      if (!trip) throw new Error('Trip not found');
      if (trip.status !== TripStatus.DISPATCHED) throw new Error('Only Dispatched trips can be completed');

      const updatedTrip = await tx.trip.update({
        where: { id },
        data: {
          status: TripStatus.COMPLETED,
          endTime: new Date(),
          actualDistance: actualDistance || trip.route.distance,
        },
      });

      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: VehicleStatus.AVAILABLE },
      });

      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: DriverStatus.AVAILABLE },
      });

      return updatedTrip;
    });
  }

  async cancelTrip(id: string) {
    return prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({
        where: { id },
      });

      if (!trip) throw new Error('Trip not found');
      if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) {
        throw new Error('Completed or cancelled trips cannot be revoked.');
      }

      const updatedTrip = await tx.trip.update({
        where: { id },
        data: {
          status: TripStatus.CANCELLED,
          endTime: new Date(),
        },
      });

      // Restore vehicle and driver availability if it was active
      if (trip.status === TripStatus.DISPATCHED) {
        await tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: VehicleStatus.AVAILABLE },
        });

        await tx.driver.update({
          where: { id: trip.driverId },
          data: { status: DriverStatus.AVAILABLE },
        });
      }

      return updatedTrip;
    });
  }

  async deleteTrip(id: string) {
    const trip = await this.repository.findById(id);
    if (!trip) throw new Error(`Trip with ID ${id} not found`);

    if (trip.status === TripStatus.DISPATCHED) {
      throw new Error('Cannot delete an active trip that has already been dispatched.');
    }

    return this.repository.delete(id);
  }
}
