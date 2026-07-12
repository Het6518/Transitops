import { prisma } from '../../../config/database';

export class ReportsRepository {
  async getOverviewStats() {
    const [vehiclesCount, driversCount, tripsCount, totalRevenue, totalExpenses, totalFuel] = await Promise.all([
      prisma.vehicle.count(),
      prisma.driver.count(),
      prisma.trip.count(),
      prisma.trip.aggregate({ _sum: { estimatedCost: true } }), // Simple proxy for revenue
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.fuelLog.aggregate({ _sum: { cost: true } }),
    ]);

    const rev = totalRevenue._sum.estimatedCost || 0;
    const exp = (totalExpenses._sum.amount || 0) + (totalFuel._sum.cost || 0);

    return {
      vehicles: vehiclesCount,
      drivers: driversCount,
      trips: tripsCount,
      revenue: rev,
      expenses: exp,
      profit: rev - exp,
    };
  }

  async getFleetStats() {
    const [totalVehicles, activeTripsCount, statusCounts, vehicleMaintenance] = await Promise.all([
      prisma.vehicle.count(),
      prisma.trip.count({ where: { status: 'DISPATCHED' } }),
      prisma.vehicle.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.maintenance.groupBy({
        by: ['vehicleId'],
        _sum: { cost: true },
        _count: true,
      })
    ]);

    const utilization = totalVehicles > 0 ? (activeTripsCount / totalVehicles) * 100 : 0;

    return {
      totalVehicles,
      utilizationRate: parseFloat(utilization.toFixed(2)),
      statuses: statusCounts.map(sc => ({ status: sc.status, count: sc._count })),
      maintenanceCostByVehicle: vehicleMaintenance.map(vm => ({
        vehicleId: vm.vehicleId,
        cost: vm._sum.cost || 0,
        count: vm._count
      }))
    };
  }

  async getExpensesStats() {
    const categoryBreakdown = await prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
      _count: true,
    });

    return categoryBreakdown.map(cb => ({
      category: cb.category,
      amount: cb._sum.amount || 0,
      count: cb._count
    }));
  }

  async getFuelStats() {
    const [totalCost, totalLiters, vehicleFuel] = await Promise.all([
      prisma.fuelLog.aggregate({ _sum: { cost: true } }),
      prisma.fuelLog.aggregate({ _sum: { liters: true } }),
      prisma.fuelLog.groupBy({
        by: ['vehicleId'],
        _sum: { cost: true, liters: true },
        _count: true,
      })
    ]);

    return {
      totalCost: totalCost._sum.cost || 0,
      totalLiters: totalLiters._sum.liters || 0,
      byVehicle: vehicleFuel.map(vf => ({
        vehicleId: vf.vehicleId,
        cost: vf._sum.cost || 0,
        liters: vf._sum.liters || 0,
        count: vf._count
      }))
    };
  }

  async getDriverStats() {
    const driverTrips = await prisma.trip.groupBy({
      by: ['driverId'],
      _count: true,
      _sum: { actualDistance: true },
    });

    const drivers = await prisma.driver.findMany({
      select: { id: true, firstName: true, lastName: true, safetyScore: true }
    });

    const driverMap = new Map(drivers.map(d => [d.id, d]));

    return driverTrips.map(dt => {
      const d = driverMap.get(dt.driverId);
      return {
        driverId: dt.driverId,
        name: d ? `${d.firstName} ${d.lastName}` : 'Unknown',
        safetyScore: d?.safetyScore || 100,
        tripsCount: dt._count,
        totalDistance: dt._sum.actualDistance || 0,
      };
    });
  }

  async getTripStats() {
    const [statusBreakdown, distanceStats] = await Promise.all([
      prisma.trip.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.trip.aggregate({
        _avg: { actualDistance: true },
        _sum: { actualDistance: true },
      })
    ]);

    return {
      statusBreakdown: statusBreakdown.map(sb => ({ status: sb.status, count: sb._count })),
      averageDistance: distanceStats._avg.actualDistance || 0,
      totalDistance: distanceStats._sum.actualDistance || 0,
    };
  }
}
