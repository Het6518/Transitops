const prisma = require('../prisma/client');
const { NotFoundError } = require('../utils/errors');

/**
 * Create a new fuel log.
 */
async function createFuelLog(data) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle) {
    throw new NotFoundError(`Vehicle '${data.vehicleId}' not found`);
  }

  return prisma.fuelLog.create({
    data,
    include: { vehicle: true },
  });
}

/**
 * List fuel logs, optionally filtered by vehicleId.
 */
async function listFuelLogs({ vehicleId } = {}) {
  const where = {};
  if (vehicleId) where.vehicleId = vehicleId;

  return prisma.fuelLog.findMany({
    where,
    include: { vehicle: true },
    orderBy: { date: 'desc' },
  });
}

async function updateFuelLog(id, data) {
  const log = await prisma.fuelLog.findUnique({ where: { id } });
  if (!log) throw new NotFoundError(`Fuel log '${id}' not found`);

  if (data.vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) throw new NotFoundError(`Vehicle '${data.vehicleId}' not found`);
  }

  return prisma.fuelLog.update({
    where: { id },
    data,
    include: { vehicle: true },
  });
}

async function deleteFuelLog(id) {
  const log = await prisma.fuelLog.findUnique({ where: { id } });
  if (!log) throw new NotFoundError(`Fuel log '${id}' not found`);

  return prisma.fuelLog.delete({ where: { id } });
}

module.exports = { createFuelLog, listFuelLogs, updateFuelLog, deleteFuelLog };
