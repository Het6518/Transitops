import { prisma } from '../../../config/database';
import { TripStatus, Prisma } from '@prisma/client';
import { CreateTripInput, UpdateTripInput } from './trips.validation';

export class TripsRepository {
  async findById(id: string) {
    return prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true,
        route: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  async create(data: CreateTripInput & { userId?: string }) {
    return prisma.trip.create({
      data: {
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        routeId: data.routeId,
        userId: data.userId || null,
        cargoWeight: data.cargoWeight,
        cargoDescription: data.cargoDescription,
        estimatedCost: data.estimatedCost || 0,
        estimatedFuel: data.estimatedFuel || 0,
        status: TripStatus.DRAFT,
      },
    });
  }

  async update(id: string, data: UpdateTripInput) {
    return prisma.trip.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.trip.delete({
      where: { id },
    });
  }

  async findMany(params: {
    search?: string;
    status?: TripStatus;
    vehicleId?: string;
    driverId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page: number;
    limit: number;
  }) {
    const { search, status, vehicleId, driverId, sortBy = 'createdAt', sortOrder = 'desc', page, limit } = params;

    const where: Prisma.TripWhereInput = {};

    if (status) {
      where.status = status;
    }
    if (vehicleId) {
      where.vehicleId = vehicleId;
    }
    if (driverId) {
      where.driverId = driverId;
    }

    if (search) {
      where.OR = [
        { cargoDescription: { contains: search, mode: 'insensitive' } },
        { vehicle: { plateNumber: { contains: search, mode: 'insensitive' } } },
        { vehicle: { model: { contains: search, mode: 'insensitive' } } },
        { driver: { firstName: { contains: search, mode: 'insensitive' } } },
        { driver: { lastName: { contains: search, mode: 'insensitive' } } },
        { route: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
        include: {
          vehicle: { select: { plateNumber: true, model: true } },
          driver: { select: { firstName: true, lastName: true, licenseNumber: true } },
          route: { select: { name: true, distance: true, startLocation: true, endLocation: true } },
        },
      }),
      prisma.trip.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStatistics() {
    const [counts, sums] = await Promise.all([
      prisma.trip.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.trip.aggregate({
        _sum: {
          estimatedCost: true,
          estimatedFuel: true,
          actualDistance: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    const statusCounts = counts.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {} as Record<TripStatus, number>);

    return {
      totalTrips: sums._count.id,
      draftCount: statusCounts.DRAFT || 0,
      dispatchedCount: statusCounts.DISPATCHED || 0,
      completedCount: statusCounts.COMPLETED || 0,
      cancelledCount: statusCounts.CANCELLED || 0,
      totalCost: Math.round((sums._sum.estimatedCost || 0) * 100) / 100,
      totalFuel: Math.round((sums._sum.estimatedFuel || 0) * 10) / 10,
      totalDistance: Math.round((sums._sum.actualDistance || 0) * 10) / 10,
    };
  }
}
