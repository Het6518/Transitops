const prisma = require('../prisma/client');
const { NotFoundError, ConflictError } = require('../utils/errors');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Attach computed isLicenseValid field to a driver object */
function withLicenseValid(driver) {
  return {
    ...driver,
    isLicenseValid: driver.licenseExpiry > new Date(),
  };
}

/** Fetch a driver by ID or throw 404 */
async function findOrFail(id) {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) throw new NotFoundError(`Driver '${id}' not found`);
  return driver;
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Create a new driver.
 */
async function createDriver(data) {
  const existing = await prisma.driver.findUnique({ where: { licenseNo: data.licenseNo } });
  if (existing) {
    throw new ConflictError(`A driver with licenseNo '${data.licenseNo}' already exists`);
  }

  const driver = await prisma.driver.create({
    data: { ...data, status: 'AVAILABLE' },
  });
  return withLicenseValid(driver);
}

/**
 * List drivers with optional filters.
 * @param {{ status?: string, licenseValid?: string }} filters
 */
async function listDrivers({ status } = {}) {
  const where = {};
  if (status) where.status = status;

  const drivers = await prisma.driver.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  return drivers.map(withLicenseValid);
}

/**
 * Get a single driver by ID (with isLicenseValid).
 */
async function getDriverById(id) {
  const driver = await findOrFail(id);
  return withLicenseValid(driver);
}

/**
 * Update driver fields.
 * - Checks licenseNo uniqueness if changing
 * - No status-change AuditLog needed at this phase (trips handle driver status)
 *
 * @param {string} id
 * @param {object} data - validated patch fields
 */
async function updateDriver(id, data) {
  await findOrFail(id); // throws 404 if not found

  // licenseNo uniqueness check on change
  if (data.licenseNo) {
    const existing = await prisma.driver.findUnique({ where: { licenseNo: data.licenseNo } });
    if (existing && existing.id !== id) {
      throw new ConflictError(`A driver with licenseNo '${data.licenseNo}' already exists`);
    }
  }

  const updated = await prisma.driver.update({ where: { id }, data });
  return withLicenseValid(updated);
}

/**
 * Delete a driver by ID.
 */
async function deleteDriver(id) {
  await findOrFail(id);
  return prisma.driver.delete({ where: { id } });
}

module.exports = { createDriver, listDrivers, getDriverById, updateDriver, deleteDriver };
