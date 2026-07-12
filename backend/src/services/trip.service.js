const prisma = require('../prisma/client');
const { NotFoundError, ConflictError, ForbiddenError, ValidationError } = require('../utils/errors');

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function findTripOrFail(tx, id) {
  const trip = await (tx || prisma).trip.findUnique({
    where: { id },
    include: { vehicle: true, driver: true },
  });
  if (!trip) throw new NotFoundError(`Trip '${id}' not found`);
  return trip;
}

/**
 * Shared pre-dispatch checks (used at creation + inside dispatch transaction).
 * Throws 404 / 403 / 400 / 409 on any violation.
 */
function assertDispatchable(vehicle, driver, cargoWeightKg) {
  if (!vehicle) throw new NotFoundError('Vehicle not found');
  if (!driver)  throw new NotFoundError('Driver not found');

  if (vehicle.status !== 'AVAILABLE') {
    throw new ConflictError(`Vehicle is not available (current status: ${vehicle.status})`);
  }
  if (driver.status !== 'AVAILABLE') {
    throw new ConflictError(`Driver is not available (current status: ${driver.status})`);
  }
  if (driver.status === 'SUSPENDED') {
    // Belt-and-suspenders: also explicitly call out suspension
    throw new ForbiddenError('Driver is suspended and cannot be assigned to a trip');
  }
  if (driver.licenseExpiry <= new Date()) {
    throw new ForbiddenError('Driver license has expired');
  }
  if (cargoWeightKg > vehicle.maxLoadKg) {
    throw new ValidationError(
      `Cargo weight ${cargoWeightKg}kg exceeds vehicle max load ${vehicle.maxLoadKg}kg`
    );
  }
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Create a DRAFT trip.
 * Per Phase 5 spec (updated), availability is validated at creation too —
 * not just at dispatch. This prevents confusing Drafts against unavailable resources.
 */
async function createTrip(data) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  const driver  = await prisma.driver.findUnique({ where: { id: data.driverId  } });

  assertDispatchable(vehicle, driver, data.cargoWeightKg);

  return prisma.trip.create({
    data: { ...data, status: 'DRAFT' },
    include: { vehicle: true, driver: true },
  });
}

/**
 * List trips with optional status filter.
 */
async function listTrips({ status } = {}) {
  const where = {};
  if (status) where.status = status;
  return prisma.trip.findMany({
    where,
    include: { vehicle: true, driver: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get a single trip by ID.
 */
async function getTripById(id) {
  return findTripOrFail(null, id);
}

/**
 * Update mutable fields on a DRAFT trip.
 * Rejected for DISPATCHED, COMPLETED, CANCELLED (immutability guard §5e).
 */
async function updateTrip(id, data) {
  const trip = await findTripOrFail(null, id);

  if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
    throw new ConflictError(
      `Trip is in terminal state '${trip.status}' and cannot be edited`
    );
  }
  if (trip.status === 'DISPATCHED') {
    throw new ConflictError(
      'A dispatched trip can only be modified via the /complete or /cancel endpoints'
    );
  }

  return prisma.trip.update({
    where: { id },
    data,
    include: { vehicle: true, driver: true },
  });
}

/**
 * Dispatch a DRAFT trip.
 *
 * RACE-SAFE: uses `updateMany` with a WHERE clause on the expected status
 * and checks `count === 0` to detect concurrent dispatch attempts.
 * A plain `update` would allow two concurrent requests to both succeed —
 * the `updateMany` + count-check is the atomic compare-and-swap that closes the race.
 *
 * All mutations happen inside a single interactive Prisma transaction —
 * any thrown error causes a full rollback, leaving no partial state.
 */
async function dispatchTrip(id, userId) {
  return prisma.$transaction(async (tx) => {
    // ── 1. Fetch trip with current vehicle + driver state ──────────────────────
    const trip = await findTripOrFail(tx, id);

    if (trip.status !== 'DRAFT') {
      throw new ConflictError(`Cannot dispatch: trip is '${trip.status}', expected DRAFT`);
    }

    // ── 2. Re-validate all pre-conditions (values may have changed since draft) ─
    assertDispatchable(trip.vehicle, trip.driver, trip.cargoWeightKg);

    // ── 3. Atomic conditional update on Vehicle ────────────────────────────────
    //    Only updates if STILL AVAILABLE — closes the concurrent-dispatch race.
    const vehicleUpdate = await tx.vehicle.updateMany({
      where: { id: trip.vehicleId, status: 'AVAILABLE' },
      data:  { status: 'ON_TRIP' },
    });
    if (vehicleUpdate.count === 0) {
      throw new ConflictError('Vehicle is no longer available (concurrent dispatch detected)');
    }

    // ── 4. Atomic conditional update on Driver ────────────────────────────────
    const driverUpdate = await tx.driver.updateMany({
      where: { id: trip.driverId, status: 'AVAILABLE' },
      data:  { status: 'ON_TRIP' },
    });
    if (driverUpdate.count === 0) {
      throw new ConflictError('Driver is no longer available (concurrent dispatch detected)');
    }

    // ── 5. Update trip status ─────────────────────────────────────────────────
    const updated = await tx.trip.update({
      where: { id },
      data:  { status: 'DISPATCHED', dispatchedAt: new Date() },
      include: { vehicle: true, driver: true },
    });

    // ── 6. Write AuditLog — inside the same transaction ──────────────────────
    await tx.auditLog.create({
      data: {
        entityType:   'Trip',
        entityId:     id,
        action:       'DISPATCH',
        performedBy:  userId,
        beforeStatus: 'DRAFT',
        afterStatus:  'DISPATCHED',
      },
    });

    return updated;
  });
}

/**
 * Complete a DISPATCHED trip.
 * Body: { actualOdometer, fuelConsumed }
 * Updates trip, vehicle.odometer, restores vehicle + driver to AVAILABLE.
 */
async function completeTrip(id, { actualOdometer, fuelConsumed }, userId) {
  return prisma.$transaction(async (tx) => {
    const trip = await findTripOrFail(tx, id);

    if (trip.status !== 'DISPATCHED') {
      throw new ConflictError(`Cannot complete: trip is '${trip.status}', expected DISPATCHED`);
    }

    const updated = await tx.trip.update({
      where: { id },
      data:  { status: 'COMPLETED', completedAt: new Date(), actualOdometer, fuelConsumed },
      include: { vehicle: true, driver: true },
    });

    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data:  { status: 'AVAILABLE', odometer: actualOdometer },
    });

    await tx.driver.update({
      where: { id: trip.driverId },
      data:  { status: 'AVAILABLE' },
    });

    await tx.auditLog.create({
      data: {
        entityType:   'Trip',
        entityId:     id,
        action:       'COMPLETE',
        performedBy:  userId,
        beforeStatus: 'DISPATCHED',
        afterStatus:  'COMPLETED',
      },
    });

    return updated;
  });
}

/**
 * Cancel a DRAFT or DISPATCHED trip.
 * - DRAFT   → set CANCELLED, no entity side effects (nothing was reserved)
 * - DISPATCHED → set CANCELLED + restore vehicle & driver to AVAILABLE
 * Both paths write an AuditLog.
 */
async function cancelTrip(id, userId) {
  return prisma.$transaction(async (tx) => {
    const trip = await findTripOrFail(tx, id);

    if (trip.status !== 'DRAFT' && trip.status !== 'DISPATCHED') {
      throw new ConflictError(
        `Cannot cancel: trip is '${trip.status}'. Only DRAFT or DISPATCHED trips can be cancelled`
      );
    }

    const wasDispatched = trip.status === 'DISPATCHED';

    const updated = await tx.trip.update({
      where: { id },
      data:  { status: 'CANCELLED' },
      include: { vehicle: true, driver: true },
    });

    if (wasDispatched) {
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data:  { status: 'AVAILABLE' },
      });
      await tx.driver.update({
        where: { id: trip.driverId },
        data:  { status: 'AVAILABLE' },
      });
    }

    await tx.auditLog.create({
      data: {
        entityType:   'Trip',
        entityId:     id,
        action:       'CANCEL',
        performedBy:  userId,
        beforeStatus: trip.status,
        afterStatus:  'CANCELLED',
      },
    });

    return updated;
  });
}

module.exports = {
  createTrip, listTrips, getTripById,
  updateTrip, dispatchTrip, completeTrip, cancelTrip,
};
