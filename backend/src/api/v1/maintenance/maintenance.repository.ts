import { Prisma, MaintenanceStatus } from '@prisma/client';
import { prisma } from '../../../config/database';

export class MaintenanceRepository {
  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.MaintenanceWhereInput;
    orderBy?: Prisma.MaintenanceOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    
    const [data, total] = await Promise.all([
      prisma.maintenance.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          vehicle: {
            select: {
              id: true,
              plateNumber: true,
              model: true,
              type: true,
              status: true,
            }
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true }
          },
          completedBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      }),
      prisma.maintenance.count({ where })
    ]);

    return { data, total };
  }

  async findById(id: string) {
    return prisma.maintenance.findUnique({
      where: { id },
      include: {
        vehicle: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        completedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });
  }

  async getStatistics() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCount,
      scheduledCount,
      inProgressCount,
      completedCount,
      monthlyCost
    ] = await Promise.all([
      prisma.maintenance.count(),
      prisma.maintenance.count({ where: { status: 'SCHEDULED' } }),
      prisma.maintenance.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.maintenance.count({ where: { status: 'COMPLETED' } }),
      prisma.maintenance.aggregate({
        _sum: { cost: true },
        where: {
          status: 'COMPLETED',
          endDate: { gte: firstDayOfMonth }
        }
      })
    ]);

    return {
      total: totalCount,
      scheduled: scheduledCount,
      inProgress: inProgressCount,
      completed: completedCount,
      monthlyCost: monthlyCost._sum.cost || 0
    };
  }

  async create(data: Prisma.MaintenanceCreateInput) {
    return prisma.maintenance.create({
      data,
      include: { vehicle: true }
    });
  }

  async update(id: string, data: Prisma.MaintenanceUpdateInput) {
    return prisma.maintenance.update({
      where: { id },
      data,
      include: { vehicle: true }
    });
  }

  async delete(id: string) {
    return prisma.maintenance.delete({
      where: { id }
    });
  }
}
