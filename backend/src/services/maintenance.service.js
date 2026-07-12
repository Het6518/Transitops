const prisma = require('../prisma/client');
const { NotFoundError, ConflictError } = require('../utils/errors');

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function findLogOrFail(tx, id) {
  const log = await (tx || prisma).maintenanceLog.findUnique({
    where: { id },
    include: { vehicle: true },
  });
  if (!log) throw new NotFoundError(`Maintenance log '${id}' not found`);
  return log;
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Open a maintenance log for a vehicle.
 * Reject if Vehicle status is ON_TRIP.
 * Transaction:
 *   - Create MaintenanceLog (isActive = true)
 *   - Set Vehicle.status = IN_SHOP
 *   - Create AuditLog (action = "MAINTENANCE_OPEN")
 */
async function openMaintenance({ vehicleId, description, cost }, userId) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      throw new NotFoundError(`Vehicle '${vehicleId}' not found`);
    }

    if (vehicle.status === 'ON_TRIP') {
      throw new ConflictError('Cannot put a vehicle in maintenance while it is ON_TRIP');
    }

    // Set vehicle status to IN_SHOP
    await tx.vehicle.update({
      where: { id: vehicleId },
      data: { status: 'IN_SHOP' },
    });

    // Create the log
    const log = await tx.maintenanceLog.create({
      data: {
        vehicleId,
        description,
        cost: cost || 0,
        isActive: true,
      },
      include: { vehicle: true },
    });

    // Create AuditLog
    await tx.auditLog.create({
      data: {
        entityType: 'MaintenanceLog',
        entityId: log.id,
        action: 'MAINTENANCE_OPEN',
        performedBy: userId,
        beforeStatus: vehicle.status,
        afterStatus: 'IN_SHOP',
      },
    });

    return log;
  });
}

/**
 * Close an active maintenance log.
 * Transaction:
 *   - Set MaintenanceLog (isActive = false, endDate = now, optional cost update)
 *   - Set Vehicle.status = AVAILABLE, unless the vehicle has been RETIRED.
 *   - Create AuditLog (action = "MAINTENANCE_CLOSE")
 */
async function closeMaintenance(id, { cost, description }, userId) {
  return prisma.$transaction(async (tx) => {
    const log = await findLogOrFail(tx, id);

    if (!log.isActive) {
      throw new ConflictError('This maintenance record has already been closed');
    }

    const updatedData = {
      isActive: false,
      endDate: new Date(),
    };
    if (cost !== undefined) updatedData.cost = cost;
    if (description !== undefined) updatedData.description = description;

    // Update log
    const updatedLog = await tx.maintenanceLog.update({
      where: { id },
      data: updatedData,
      include: { vehicle: true },
    });

    // Determine target vehicle status: keep it RETIRED if it was set to RETIRED during maintenance,
    // otherwise set it back to AVAILABLE.
    const currentVehicleStatus = log.vehicle.status;
    let targetVehicleStatus = 'AVAILABLE';
    if (currentVehicleStatus === 'RETIRED') {
      targetVehicleStatus = 'RETIRED';
    }

    await tx.vehicle.update({
      where: { id: log.vehicleId },
      data: { status: targetVehicleStatus },
    });

    // Create AuditLog
    await tx.auditLog.create({
      data: {
        entityType: 'MaintenanceLog',
        entityId: id,
        action: 'MAINTENANCE_CLOSE',
        performedBy: userId,
        beforeStatus: currentVehicleStatus,
        afterStatus: targetVehicleStatus,
      },
    });

    return updatedLog;
  });
}

/**
 * List maintenance logs, optionally filtered by vehicleId.
 */
async function listMaintenance({ vehicleId } = {}) {
  const where = {};
  if (vehicleId) where.vehicleId = vehicleId;

  return prisma.maintenanceLog.findMany({
    where,
    include: { vehicle: true },
    orderBy: { startDate: 'desc' },
  });
}

module.exports = { openMaintenance, closeMaintenance, listMaintenance };
