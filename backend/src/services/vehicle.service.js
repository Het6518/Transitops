const prisma = require('../prisma/client');
const { NotFoundError, ConflictError } = require('../utils/errors');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetch a vehicle by ID or throw 404.
 */
async function findOrFail(id) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new NotFoundError(`Vehicle '${id}' not found`);
  return vehicle;
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Create a new vehicle.
 * regNo must already be normalized (uppercase, trimmed) by the caller.
 */
async function createVehicle(data) {
  const existing = await prisma.vehicle.findUnique({ where: { regNo: data.regNo } });
  if (existing) {
    throw new ConflictError(`A vehicle with regNo '${data.regNo}' already exists`);
  }

  return prisma.vehicle.create({
    data: {
      ...data,
      status: 'AVAILABLE', // always start as AVAILABLE on creation
    },
  });
}

/**
 * List vehicles with optional query filters.
 * @param {{ status?: string, type?: string }} filters
 */
async function listVehicles({ status, type } = {}) {
  const where = {};

  if (status) {
    where.status = status; // exact enum match
  }
  if (type) {
    // Case-insensitive partial match — lets "truck" match "Heavy Truck"
    where.type = { contains: type, mode: 'insensitive' };
  }

  return prisma.vehicle.findMany({
    where,
    orderBy: { regNo: 'asc' },
  });
}

/**
 * Get a single vehicle by ID.
 */
async function getVehicleById(id) {
  return findOrFail(id);
}

/**
 * Update vehicle fields. Handles:
 *   - regNo uniqueness (only if regNo is changing)
 *   - Retire guard: cannot retire an ON_TRIP vehicle
 *   - AuditLog written inside the same transaction on status change
 *
 * @param {string} id
 * @param {object} data - validated patch fields
 * @param {string} userId - from req.user.userId (for AuditLog)
 */
async function updateVehicle(id, data, userId) {
  const vehicle = await findOrFail(id);

  // ── Retire guard ────────────────────────────────────────────────────────────
  if (data.status === 'RETIRED' && vehicle.status === 'ON_TRIP') {
    throw new ConflictError(
      'Cannot retire a vehicle that is currently ON_TRIP. Complete or cancel the active trip first.'
    );
  }

  // ── regNo uniqueness on change ──────────────────────────────────────────────
  if (data.regNo && data.regNo !== vehicle.regNo) {
    const existing = await prisma.vehicle.findUnique({ where: { regNo: data.regNo } });
    if (existing) {
      throw new ConflictError(`A vehicle with regNo '${data.regNo}' already exists`);
    }
  }

  // ── Status change → write AuditLog inside same transaction ──────────────────
  const statusChanging = data.status && data.status !== vehicle.status;

  if (statusChanging) {
    const action = data.status === 'RETIRED' ? 'RETIRE' : 'STATUS_CHANGE';

    const [updated] = await prisma.$transaction([
      prisma.vehicle.update({ where: { id }, data }),
      prisma.auditLog.create({
        data: {
          entityType:   'Vehicle',
          entityId:     id,
          action,
          performedBy:  userId,
          beforeStatus: vehicle.status,
          afterStatus:  data.status,
        },
      }),
    ]);
    return updated;
  }

  // Non-status update — no audit log needed
  return prisma.vehicle.update({ where: { id }, data });
}

/**
 * Delete a vehicle by ID.
 * Prisma will throw if FK constraints are violated (e.g., vehicle has trips).
 */
async function deleteVehicle(id) {
  await findOrFail(id); // throws 404 if not found
  return prisma.vehicle.delete({ where: { id } });
}

module.exports = { createVehicle, listVehicles, getVehicleById, updateVehicle, deleteVehicle };
