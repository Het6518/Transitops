import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';

const fuelLogInclude = {
  vehicle: {
    select: { id: true, plateNumber: true, model: true, type: true, status: true }
  },
  driver: {
    select: { id: true, firstName: true, lastName: true }
  },
  trip: {
    select: { id: true, status: true }
  }
};

export class FuelRepository {
  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.FuelLogWhereInput;
    orderBy?: Prisma.FuelLogOrderByWithRelationInput;
  }) {
    const [data, total] = await Promise.all([
      prisma.fuelLog.findMany({
        ...params,
        include: fuelLogInclude
      }),
      prisma.fuelLog.count({ where: params.where })
    ]);
    return { data, total };
  }

  async findById(id: string) {
    return prisma.fuelLog.findUnique({
      where: { id },
      include: fuelLogInclude
    });
  }

  async create(data: Prisma.FuelLogCreateInput) {
    return prisma.fuelLog.create({ data, include: fuelLogInclude });
  }

  async update(id: string, data: Prisma.FuelLogUpdateInput) {
    return prisma.fuelLog.update({ where: { id }, data, include: fuelLogInclude });
  }

  async delete(id: string) {
    return prisma.fuelLog.delete({ where: { id } });
  }

  async getStatistics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalCount, monthlyData, totalCost, monthlyCost, vehicleCosts] = await Promise.all([
      prisma.fuelLog.count(),
      prisma.fuelLog.count({ where: { loggedAt: { gte: startOfMonth } } }),
      prisma.fuelLog.aggregate({ _sum: { cost: true, liters: true } }),
      prisma.fuelLog.aggregate({
        _sum: { cost: true, liters: true },
        where: { loggedAt: { gte: startOfMonth } }
      }),
      prisma.fuelLog.groupBy({
        by: ['vehicleId'],
        _sum: { cost: true, liters: true },
        _count: true,
        orderBy: { _sum: { cost: 'desc' } },
        take: 10
      })
    ]);

    // Get vehicle details for top consumers
    const vehicleIds = vehicleCosts.map(vc => vc.vehicleId);
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds } },
      select: { id: true, plateNumber: true, model: true }
    });
    const vehicleMap = new Map(vehicles.map(v => [v.id, v]));

    const topVehicles = vehicleCosts.map(vc => ({
      vehicle: vehicleMap.get(vc.vehicleId) || { id: vc.vehicleId, plateNumber: 'Unknown', model: 'Unknown' },
      totalCost: vc._sum.cost || 0,
      totalLiters: vc._sum.liters || 0,
      count: vc._count
    }));

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyTrend = await prisma.$queryRaw<{ month: string; total_cost: number; total_liters: number }[]>`
      SELECT 
        TO_CHAR(logged_at, 'YYYY-MM') as month,
        SUM(cost)::float as total_cost,
        SUM(liters)::float as total_liters
      FROM fuel_logs
      WHERE logged_at >= ${sixMonthsAgo}
      GROUP BY TO_CHAR(logged_at, 'YYYY-MM')
      ORDER BY month ASC
    `;

    return {
      total: totalCount,
      thisMonth: monthlyData,
      totalCost: totalCost._sum.cost || 0,
      totalLiters: totalCost._sum.liters || 0,
      monthlyCost: monthlyCost._sum.cost || 0,
      monthlyLiters: monthlyCost._sum.liters || 0,
      topVehicles,
      monthlyTrend: monthlyTrend.map(m => ({
        month: m.month,
        cost: m.total_cost,
        liters: m.total_liters
      }))
    };
  }
}
