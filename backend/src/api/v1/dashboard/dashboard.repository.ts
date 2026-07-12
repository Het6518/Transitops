import { prisma } from '../../../config/database';
import { VehicleStatus, TripStatus, MaintenanceStatus, TransactionType } from '@prisma/client';

export class DashboardRepository {
  /** Get vehicle count aggregated by status */
  async getVehicleStatusCounts() {
    const counts = await prisma.vehicle.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    const result = {
      AVAILABLE: 0,
      ON_TRIP: 0,
      IN_SHOP: 0,
      RETIRED: 0,
    };

    counts.forEach((c) => {
      if (c.status in result) {
        result[c.status as keyof typeof result] = c._count._all;
      }
    });

    return result;
  }

  /** Get trip count aggregated by status */
  async getTripStatusCounts() {
    const counts = await prisma.trip.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    const result = {
      DRAFT: 0,
      DISPATCHED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    counts.forEach((c) => {
      if (c.status in result) {
        result[c.status as keyof typeof result] = c._count._all;
      }
    });

    return result;
  }

  /** Count number of drivers (users with DRIVER role) */
  async getDriverCount() {
    return prisma.user.count({
      where: {
        role: 'DRIVER',
        status: 'ACTIVE',
      },
    });
  }

  /** Count number of active drivers currently on duty (assigned to a DISPATCHED trip) */
  async getActiveDriversCount() {
    const activeTrips = await prisma.trip.findMany({
      where: {
        status: TripStatus.DISPATCHED,
      },
      select: {
        driverId: true,
      },
    });
    const uniqueDrivers = new Set(activeTrips.map((t) => t.driverId));
    return uniqueDrivers.size;
  }

  /** Calculate total fuel cost logged */
  async getFuelCostTotal() {
    const aggregate = await prisma.fuelLog.aggregate({
      _sum: {
        cost: true,
      },
    });
    return aggregate._sum.cost || 0;
  }

  /** Get transaction totals by type (REVENUE vs EXPENSE) */
  async getFinancialTotals() {
    const totals = await prisma.transaction.groupBy({
      by: ['type'],
      _sum: {
        amount: true,
      },
    });

    let revenue = 0;
    let expense = 0;

    totals.forEach((t) => {
      if (t.type === TransactionType.REVENUE) {
        revenue = t._sum.amount || 0;
      } else if (t.type === TransactionType.EXPENSE) {
        expense = t._sum.amount || 0;
      }
    });

    return { revenue, expense };
  }

  /** Get top 5 recent trips with vehicle, driver, and route details */
  async getRecentTrips(limit = 5) {
    return prisma.trip.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        vehicle: {
          select: {
            plateNumber: true,
            model: true,
          },
        },
        driver: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        route: {
          select: {
            name: true,
            startLocation: true,
            endLocation: true,
          },
        },
      },
    });
  }

  /** Get top 5 recent maintenance logs */
  async getRecentMaintenances(limit = 5) {
    return prisma.maintenance.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        vehicle: {
          select: {
            plateNumber: true,
            model: true,
          },
        },
      },
    });
  }

  /** Get top 10 recent activities / audit logs */
  async getRecentActivities(limit = 10) {
    return prisma.auditLog.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /** Get monthly financial transactions for Area Chart (last 6 months) */
  async getMonthlyFinancialTrends() {
    // Standard query for last 6 months transaction summaries
    // For Neon compatibility, we load recent transactions and aggregate them in service layer
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return prisma.transaction.findMany({
      where: {
        date: {
          gte: sixMonthsAgo,
        },
      },
      orderBy: {
        date: 'asc',
      },
      select: {
        type: true,
        amount: true,
        date: true,
      },
    });
  }

  /** Get fuel and trip stats trends for line/bar charts */
  async getOperationalTrends() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const fuelLogs = await prisma.fuelLog.findMany({
      where: {
        loggedAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        loggedAt: 'asc',
      },
      select: {
        cost: true,
        liters: true,
        loggedAt: true,
      },
    });

    const trips = await prisma.trip.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        status: true,
        actualDistance: true,
        createdAt: true,
      },
    });

    return { fuelLogs, trips };
  }
}
