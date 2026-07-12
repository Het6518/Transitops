import { MaintenanceRepository } from './maintenance.repository';
import { Prisma, MaintenanceStatus } from '@prisma/client';
import { prisma } from '../../../config/database';

export class MaintenanceService {
  private repo = new MaintenanceRepository();

  async getMaintenanceRecords(params: {
    page: number;
    limit: number;
    status?: string;
    vehicleId?: string;
  }) {
    const skip = (params.page - 1) * params.limit;
    
    const where: Prisma.MaintenanceWhereInput = {};
    if (params.status) where.status = params.status as MaintenanceStatus;
    if (params.vehicleId) where.vehicleId = params.vehicleId;

    const { data, total } = await this.repo.findAll({
      skip,
      take: params.limit,
      where,
      orderBy: { startDate: 'desc' }
    });

    return {
      data,
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit)
      }
    };
  }

  async getMaintenanceById(id: string) {
    const record = await this.repo.findById(id);
    if (!record) throw new Error('Maintenance record not found');
    return record;
  }

  async getStatistics() {
    return this.repo.getStatistics();
  }

  async createMaintenance(data: {
    vehicleId: string;
    serviceType: string;
    description: string;
    cost: number;
    status?: MaintenanceStatus;
    startDate: string;
    endDate?: string | null;
    userId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Verify vehicle exists
      const vehicle = await tx.vehicle.findUnique({ where: { id: data.vehicleId } });
      if (!vehicle) throw new Error('Vehicle not found');

      // 2. Create maintenance record
      const record = await tx.maintenance.create({
        data: {
          vehicleId: data.vehicleId,
          serviceType: data.serviceType,
          description: data.description,
          cost: data.cost,
          status: data.status || 'SCHEDULED',
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          createdById: data.userId
        },
        include: { vehicle: true }
      });

      // 3. Update vehicle status if IN_PROGRESS
      if (record.status === 'IN_PROGRESS' && vehicle.status === 'AVAILABLE') {
        await tx.vehicle.update({
          where: { id: vehicle.id },
          data: { status: 'IN_SHOP' }
        });
      }

      return record;
    });
  }

  async updateMaintenance(id: string, data: {
    serviceType?: string;
    description?: string;
    cost?: number;
    status?: MaintenanceStatus;
    startDate?: string;
    endDate?: string | null;
  }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.maintenance.findUnique({ 
        where: { id },
        include: { vehicle: true }
      });
      if (!existing) throw new Error('Maintenance record not found');

      const updateData: Prisma.MaintenanceUpdateInput = {};
      if (data.serviceType !== undefined) updateData.serviceType = data.serviceType;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.cost !== undefined) updateData.cost = data.cost;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
      if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

      const record = await tx.maintenance.update({
        where: { id },
        data: updateData,
        include: { vehicle: true }
      });

      // Handle Vehicle state transitions
      const vehicle = existing.vehicle;
      if (data.status === 'IN_PROGRESS' && existing.status !== 'IN_PROGRESS' && vehicle.status === 'AVAILABLE') {
        await tx.vehicle.update({
          where: { id: vehicle.id },
          data: { status: 'IN_SHOP' }
        });
      } else if ((data.status === 'COMPLETED' || data.status === 'CANCELLED') && 
                 existing.status === 'IN_PROGRESS' && vehicle.status === 'IN_SHOP') {
        await tx.vehicle.update({
          where: { id: vehicle.id },
          data: { status: 'AVAILABLE' }
        });
      }

      return record;
    });
  }

  async completeMaintenance(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.maintenance.findUnique({ 
        where: { id },
        include: { vehicle: true }
      });
      if (!existing) throw new Error('Maintenance record not found');
      if (existing.status === 'COMPLETED') throw new Error('Maintenance is already completed');

      const record = await tx.maintenance.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          endDate: new Date(),
          completedById: userId
        },
        include: { vehicle: true }
      });

      // Restore vehicle status
      if (existing.vehicle.status === 'IN_SHOP') {
        await tx.vehicle.update({
          where: { id: existing.vehicle.id },
          data: { status: 'AVAILABLE' }
        });
      }

      return record;
    });
  }

  async deleteMaintenance(id: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.maintenance.findUnique({ 
        where: { id },
        include: { vehicle: true }
      });
      if (!existing) throw new Error('Maintenance record not found');

      await tx.maintenance.delete({ where: { id } });

      // If we delete an in-progress maintenance, try to restore vehicle
      if (existing.status === 'IN_PROGRESS' && existing.vehicle.status === 'IN_SHOP') {
        await tx.vehicle.update({
          where: { id: existing.vehicle.id },
          data: { status: 'AVAILABLE' }
        });
      }

      return true;
    });
  }
}
