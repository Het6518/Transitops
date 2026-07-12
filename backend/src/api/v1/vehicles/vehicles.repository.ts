import { prisma } from '../../../config/database';
import { VehicleStatus, Prisma } from '@prisma/client';
import { CreateVehicleInput, UpdateVehicleInput } from './vehicles.validation';

export class VehiclesRepository {
  async findByPlateNumber(plateNumber: string) {
    return prisma.vehicle.findUnique({
      where: { plateNumber },
    });
  }

  async findById(id: string) {
    return prisma.vehicle.findUnique({
      where: { id },
      include: {
        trips: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            driver: {
              select: { firstName: true, lastName: true },
            },
            route: {
              select: { name: true },
            },
          },
        },
        maintenances: {
          take: 5,
          orderBy: { startDate: 'desc' },
        },
      },
    });
  }

  async create(data: CreateVehicleInput) {
    return prisma.vehicle.create({
      data: {
        plateNumber: data.plateNumber,
        model: data.model,
        type: data.type,
        status: data.status || VehicleStatus.AVAILABLE,
        fuelType: data.fuelType,
        fuelCapacity: data.fuelCapacity,
        mileage: data.mileage || 0,
      },
    });
  }

  async update(id: string, data: UpdateVehicleInput) {
    return prisma.vehicle.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.vehicle.delete({
      where: { id },
    });
  }

  async findMany(params: {
    search?: string;
    status?: VehicleStatus;
    type?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page: number;
    limit: number;
  }) {
    const { search, status, type, sortBy = 'createdAt', sortOrder = 'desc', page, limit } = params;

    const where: Prisma.VehicleWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = {
        equals: type,
        mode: 'insensitive',
      };
    }

    if (search) {
      where.OR = [
        { plateNumber: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.vehicle.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
