const prisma = require('../prisma/client');
const { NotFoundError } = require('../utils/errors');

/**
 * Create a new expense.
 */
async function createExpense(data) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle) {
    throw new NotFoundError(`Vehicle '${data.vehicleId}' not found`);
  }

  return prisma.expense.create({
    data,
    include: { vehicle: true },
  });
}

/**
 * List expenses, optionally filtered by vehicleId.
 */
async function listExpenses({ vehicleId } = {}) {
  const where = {};
  if (vehicleId) where.vehicleId = vehicleId;

  return prisma.expense.findMany({
    where,
    include: { vehicle: true },
    orderBy: { date: 'desc' },
  });
}

module.exports = { createExpense, listExpenses };
