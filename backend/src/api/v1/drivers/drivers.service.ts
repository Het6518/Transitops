import { DriversRepository } from './drivers.repository';
import { CreateDriverInput, UpdateDriverInput } from './drivers.validation';
import { DriverStatus, TripStatus } from '@prisma/client';

export class DriversService {
  private repository = new DriversRepository();

  // Valid status transition rules
  private static VALID_TRANSITIONS: Record<DriverStatus, DriverStatus[]> = {
    [DriverStatus.AVAILABLE]: [DriverStatus.ON_TRIP, DriverStatus.OFF_DUTY, DriverStatus.SUSPENDED],
    [DriverStatus.ON_TRIP]: [DriverStatus.AVAILABLE, DriverStatus.OFF_DUTY],
    [DriverStatus.OFF_DUTY]: [DriverStatus.AVAILABLE, DriverStatus.SUSPENDED],
    [DriverStatus.SUSPENDED]: [DriverStatus.OFF_DUTY], // Must go through OFF_DUTY before becoming AVAILABLE
  };

  async getDrivers(params: {
    search?: string;
    status?: DriverStatus;
    licenseCategory?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const page = Number(params.page) || 1;
    const limit = Math.min(Number(params.limit) || 10, 100);
    return this.repository.findMany({ ...params, page, limit });
  }

  async getDriverById(id: string) {
    const driver = await this.repository.findById(id);
    if (!driver) throw new Error(`Driver with ID "${id}" not found`);
    return driver;
  }

  async getAvailableDrivers() {
    return this.repository.findAvailable();
  }

  async getStatistics() {
    return this.repository.getStatistics();
  }

  async createDriver(data: CreateDriverInput) {
    // 1. Prevent duplicate license numbers
    const existingLicense = await this.repository.findByLicenseNumber(data.licenseNumber);
    if (existingLicense) {
      throw new Error(`A driver with license number "${data.licenseNumber}" already exists`);
    }

    // 2. Prevent duplicate emails
    const existingEmail = await this.repository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error(`A driver with email "${data.email}" already exists`);
    }

    return this.repository.create(data);
  }

  async updateDriver(id: string, data: UpdateDriverInput) {
    const current = await this.repository.findById(id);
    if (!current) throw new Error(`Driver with ID "${id}" not found`);

    // 1. Prevent duplicate license number changes
    if (data.licenseNumber && data.licenseNumber !== current.licenseNumber) {
      const existing = await this.repository.findByLicenseNumber(data.licenseNumber);
      if (existing) throw new Error(`License number "${data.licenseNumber}" is already assigned to another driver`);
    }

    // 2. Prevent duplicate email changes
    if (data.email && data.email !== current.email) {
      const existing = await this.repository.findByEmail(data.email);
      if (existing) throw new Error(`Email "${data.email}" is already registered to another driver`);
    }

    // 3. Validate status transitions
    if (data.status && data.status !== current.status) {
      const allowed = DriversService.VALID_TRANSITIONS[current.status];
      if (!allowed.includes(data.status)) {
        throw new Error(
          `Cannot transition driver status from "${current.status}" to "${data.status}". Allowed transitions: ${allowed.join(', ') || 'none'}`
        );
      }
    }

    return this.repository.update(id, data);
  }

  async deleteDriver(id: string) {
    const driver = await this.repository.findById(id);
    if (!driver) throw new Error(`Driver with ID "${id}" not found`);

    // Prevent deleting a driver on an active trip
    if (driver.status === DriverStatus.ON_TRIP) {
      throw new Error('Cannot delete a driver who is currently on an active trip');
    }

    // Prevent deleting a driver with active trips
    const activeTrips = driver.trips?.filter((t) => t.status === TripStatus.DISPATCHED || t.status === TripStatus.DRAFT);
    if (activeTrips && activeTrips.length > 0) {
      throw new Error(`Cannot delete driver: has ${activeTrips.length} active/pending trip(s)`);
    }

    return this.repository.delete(id);
  }
}
