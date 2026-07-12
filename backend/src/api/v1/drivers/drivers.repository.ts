import { prisma } from '../../../config/database';
import { DriverStatus, Prisma } from '@prisma/client';
import { CreateDriverInput, UpdateDriverInput } from './drivers.validation';

export class DriversRepository {
  async findByLicenseNumber(licenseNumber: string) {
    return prisma.driver.findUnique({ where: { licenseNumber } });
  }

  async findByEmail(email: string) {
    return prisma.driver.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return prisma.driver.findUnique({
      where: { id },
      include: {
        trips: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            vehicle: { select: { plateNumber: true, model: true } },
            route: { select: { name: true, startLocation: true, endLocation: true } },
          },
        },
      },
    });
  }

  async create(data: CreateDriverInput) {
    return prisma.driver.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        contactNumber: data.contactNumber,
        licenseNumber: data.licenseNumber,
        licenseCategory: data.licenseCategory,
        licenseExpiry: new Date(data.licenseExpiry),
        status: data.status || DriverStatus.AVAILABLE,
        safetyScore: data.safetyScore ?? 100,
        address: data.address,
        notes: data.notes,
      },
    });
  }

  async update(id: string, data: UpdateDriverInput) {
    const updateData: Prisma.DriverUpdateInput = { ...data };
    if (data.licenseExpiry) {
      updateData.licenseExpiry = new Date(data.licenseExpiry);
    }
    return prisma.driver.update({ where: { id }, data: updateData });
  }

  async delete(id: string) {
    return prisma.driver.delete({ where: { id } });
  }

  async findMany(params: {
    search?: string;
    status?: DriverStatus;
    licenseCategory?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page: number;
    limit: number;
  }) {
    const { search, status, licenseCategory, sortBy = 'createdAt', sortOrder = 'desc', page, limit } = params;

    const where: Prisma.DriverWhereInput = {};

    if (status) where.status = status;
    if (licenseCategory) where.licenseCategory = { equals: licenseCategory, mode: 'insensitive' };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
        { contactNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.driver.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAvailable() {
    return prisma.driver.findMany({
      where: {
        status: DriverStatus.AVAILABLE,
        licenseExpiry: { gt: new Date() },
      },
      orderBy: { safetyScore: 'desc' },
    });
  }

  async getStatistics() {
    const [total, available, onTrip, offDuty, suspended, expiringSoon] = await Promise.all([
      prisma.driver.count(),
      prisma.driver.count({ where: { status: DriverStatus.AVAILABLE } }),
      prisma.driver.count({ where: { status: DriverStatus.ON_TRIP } }),
      prisma.driver.count({ where: { status: DriverStatus.OFF_DUTY } }),
      prisma.driver.count({ where: { status: DriverStatus.SUSPENDED } }),
      prisma.driver.count({
        where: {
          licenseExpiry: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            gte: new Date(),
          },
        },
      }),
    ]);

    const avgScore = await prisma.driver.aggregate({ _avg: { safetyScore: true } });

    return {
      total,
      available,
      onTrip,
      offDuty,
      suspended,
      expiringSoon,
      averageSafetyScore: Math.round((avgScore._avg.safetyScore ?? 0) * 10) / 10,
    };
  }
}
