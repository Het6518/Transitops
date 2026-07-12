import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';

const expenseInclude = {
  vehicle: {
    select: { id: true, plateNumber: true, model: true, type: true, status: true }
  },
  trip: {
    select: { id: true, status: true }
  }
};

export class ExpenseRepository {
  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ExpenseWhereInput;
    orderBy?: Prisma.ExpenseOrderByWithRelationInput;
  }) {
    const [data, total] = await Promise.all([
      prisma.expense.findMany({
        ...params,
        include: expenseInclude
      }),
      prisma.expense.count({ where: params.where })
    ]);
    return { data, total };
  }

  async findById(id: string) {
    return prisma.expense.findUnique({
      where: { id },
      include: expenseInclude
    });
  }

  async create(data: Prisma.ExpenseCreateInput) {
    return prisma.expense.create({ data, include: expenseInclude });
  }

  async update(id: string, data: Prisma.ExpenseUpdateInput) {
    return prisma.expense.update({ where: { id }, data, include: expenseInclude });
  }

  async delete(id: string) {
    return prisma.expense.delete({ where: { id } });
  }

  async getStatistics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalCount, monthlyCount, totalAmount, monthlyAmount, categoryBreakdown, vehicleCosts] = await Promise.all([
      prisma.expense.count(),
      prisma.expense.count({ where: { date: { gte: startOfMonth } } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { date: { gte: startOfMonth } }
      }),
      prisma.expense.groupBy({
        by: ['category'],
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } }
      }),
      prisma.expense.groupBy({
        by: ['vehicleId'],
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
        take: 10
      })
    ]);

    // Get vehicle details for top spenders
    const vehicleIds = vehicleCosts.map(vc => vc.vehicleId);
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds } },
      select: { id: true, plateNumber: true, model: true }
    });
    const vehicleMap = new Map(vehicles.map(v => [v.id, v]));

    const topVehicles = vehicleCosts.map(vc => ({
      vehicle: vehicleMap.get(vc.vehicleId) || { id: vc.vehicleId, plateNumber: 'Unknown', model: 'Unknown' },
      totalAmount: vc._sum.amount || 0,
      count: vc._count
    }));

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyTrend = await prisma.$queryRaw<{ month: string; total_amount: number }[]>`
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(amount)::float as total_amount
      FROM expenses
      WHERE date >= ${sixMonthsAgo}
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month ASC
    `;

    return {
      total: totalCount,
      thisMonth: monthlyCount,
      totalAmount: totalAmount._sum.amount || 0,
      monthlyAmount: monthlyAmount._sum.amount || 0,
      categoryBreakdown: categoryBreakdown.map(cb => ({
        category: cb.category,
        amount: cb._sum.amount || 0,
        count: cb._count
      })),
      topVehicles,
      monthlyTrend: monthlyTrend.map(m => ({
        month: m.month,
        amount: m.total_amount
      }))
    };
  }
}
