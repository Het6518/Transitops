const prisma = require('../prisma/client');

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Get dashboard KPIs.
 * Supports filters: vehicleType (e.g. truck/van), status (vehicle status).
 */
async function getDashboardKPIs({ vehicleType, status } = {}) {
  // Build vehicle filter
  const vehicleWhere = { status: { not: 'RETIRED' } };
  if (vehicleType) vehicleWhere.type = vehicleType;
  if (status) vehicleWhere.status = status;

  const totalNonRetiredVehicles = await prisma.vehicle.count({
    where: { status: { not: 'RETIRED' }, ...(vehicleType ? { type: vehicleType } : {}) },
  });

  const activeVehicles = await prisma.vehicle.count({
    where: vehicleWhere,
  });

  const availableVehicles = await prisma.vehicle.count({
    where: { status: 'AVAILABLE', ...(vehicleType ? { type: vehicleType } : {}) },
  });

  const inMaintenance = await prisma.vehicle.count({
    where: { status: 'IN_SHOP', ...(vehicleType ? { type: vehicleType } : {}) },
  });

  const vehiclesOnTrip = await prisma.vehicle.count({
    where: { status: 'ON_TRIP', ...(vehicleType ? { type: vehicleType } : {}) },
  });

  // Trip counts (filter trips by vehicle type if vehicleType is provided)
  const tripWhere = {};
  if (vehicleType) {
    tripWhere.vehicle = { type: vehicleType };
  }

  const activeTrips = await prisma.trip.count({
    where: { ...tripWhere, status: 'DISPATCHED' },
  });

  const pendingTrips = await prisma.trip.count({
    where: { ...tripWhere, status: 'DRAFT' },
  });

  // Driver counts (not vehicle specific, but let's keep it global or role checked)
  const driversOnDuty = await prisma.driver.count({
    where: { status: 'ON_TRIP' },
  });

  // Fleet utilization percentage: (vehicles ON_TRIP) / (total non-retired vehicles) * 100
  let fleetUtilization = 0;
  if (totalNonRetiredVehicles > 0) {
    fleetUtilization = (vehiclesOnTrip / totalNonRetiredVehicles) * 100;
  }

  // Get vehicle status breakdown
  const vehicleStatuses = await prisma.vehicle.groupBy({
    by: ['status'],
    _count: {
      status: true,
    },
    where: vehicleType ? { type: vehicleType } : {},
  });

  const vehicleStatusBreakdown = {
    AVAILABLE: 0,
    ON_TRIP:   0,
    IN_SHOP:   0,
    RETIRED:   0,
  };
  for (const item of vehicleStatuses) {
    if (item.status in vehicleStatusBreakdown) {
      vehicleStatusBreakdown[item.status] = item._count.status;
    }
  }

  // Get recent trips
  const recentTrips = await prisma.trip.findMany({
    where: {
      ...(vehicleType ? { vehicle: { type: vehicleType } } : {}),
      ...(status ? { status } : {}),
    },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      vehicle: true,
      driver: true,
    },
  });

  return {
    activeVehicles,
    availableVehicles,
    inMaintenance,
    vehiclesInMaintenance: inMaintenance,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    fleetUtilization: parseFloat(fleetUtilization.toFixed(2)),
    vehicleStatusBreakdown,
    recentTrips,
  };
}

/**
 * Get per-vehicle report data.
 * Returns an array of report rows for all vehicles.
 */
async function getVehicleReportData() {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      trips: { where: { status: 'COMPLETED' } },
      fuelLogs: true,
      maintenanceLogs: true,
    },
  });

  return vehicles.map((vehicle) => {
    // 1. Total distance driven (sum of plannedDistance of completed trips)
    const totalDistanceDriven = vehicle.trips.reduce((sum, t) => sum + t.plannedDistance, 0);

    // 2. Total fuel consumed (sum of fuel consumed in completed trips + liters refueled in fuel logs)
    const tripFuel = vehicle.trips.reduce((sum, t) => sum + (t.fuelConsumed || 0), 0);
    const logFuel = vehicle.fuelLogs.reduce((sum, fl) => sum + fl.liters, 0);
    const totalFuelConsumed = tripFuel + logFuel;

    // 3. Fuel efficiency (distance / fuel)
    const fuelEfficiency = totalFuelConsumed > 0 ? (totalDistanceDriven / totalFuelConsumed) : 0;

    // 4. Operational costs (fuel log cost + maintenance log cost)
    const totalFuelCost = vehicle.fuelLogs.reduce((sum, fl) => sum + fl.cost, 0);
    const totalMaintenanceCost = vehicle.maintenanceLogs.reduce((sum, ml) => sum + ml.cost, 0);
    const operationalCost = totalFuelCost + totalMaintenanceCost;

    // 5. Computed ROI (using static assumption of $1000 revenue per completed trip)
    // Formula: (Revenue - OperationalCost) / AcquisitionCost * 100
    const assumedRevenue = vehicle.trips.length * 1000;
    const vehicleROI = vehicle.acquisitionCost > 0
      ? ((assumedRevenue - operationalCost) / vehicle.acquisitionCost) * 100
      : 0;

    return {
      vehicleId: vehicle.id,
      regNo: vehicle.regNo,
      name: vehicle.name,
      type: vehicle.type,
      totalDistanceDriven: parseFloat(totalDistanceDriven.toFixed(2)),
      totalFuelConsumed: parseFloat(totalFuelConsumed.toFixed(2)),
      fuelEfficiency: parseFloat(fuelEfficiency.toFixed(2)),
      totalFuelCost: parseFloat(totalFuelCost.toFixed(2)),
      totalMaintenanceCost: parseFloat(totalMaintenanceCost.toFixed(2)),
      operationalCost: parseFloat(operationalCost.toFixed(2)),
      vehicleROI: parseFloat(vehicleROI.toFixed(2)),
    };
  });
}

/**
 * Get license expiry alerts.
 * Returns drivers whose license expires within withinDays.
 */
async function getLicenseAlerts(withinDays = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + withinDays);

  const drivers = await prisma.driver.findMany({
    where: {
      licenseExpiry: {
        gte: new Date(),
        lte: cutoffDate,
      },
    },
    orderBy: { licenseExpiry: 'asc' },
  });

  return drivers.map((driver) => ({
    id: driver.id,
    name: driver.name,
    licenseNo: driver.licenseNo,
    licenseExpiry: driver.licenseExpiry,
    isLicenseValid: driver.licenseExpiry > new Date(),
  }));
}

/**
 * Get maintenance summary per vehicle.
 */
async function getMaintenanceSummary() {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      maintenanceLogs: {
        orderBy: { startDate: 'desc' },
      },
    },
  });

  return vehicles.map((vehicle) => {
    const logs = vehicle.maintenanceLogs;
    const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);
    const activeLog = logs.find((log) => log.isActive);

    return {
      vehicleId: vehicle.id,
      regNo: vehicle.regNo,
      name: vehicle.name,
      maintenanceCount: logs.length,
      totalMaintenanceCost: parseFloat(totalCost.toFixed(2)),
      mostRecentMaintenanceDate: logs[0] ? logs[0].startDate : null,
      currentlyActiveMaintenance: activeLog ? {
        id: activeLog.id,
        description: activeLog.description,
        startDate: activeLog.startDate,
      } : null,
      // Frontend expected fields
      totalRecords: logs.length,
      totalCost: parseFloat(totalCost.toFixed(2)),
      activeCount: logs.filter((log) => log.isActive).length,
    };
  });
}

module.exports = {
  getDashboardKPIs,
  getVehicleReportData,
  getLicenseAlerts,
  getMaintenanceSummary,
};
