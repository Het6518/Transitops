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

async function updateExpense(id, data) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw new NotFoundError(`Expense '${id}' not found`);

  if (data.vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) throw new NotFoundError(`Vehicle '${data.vehicleId}' not found`);
  }

  return prisma.expense.update({
    where: { id },
    data,
    include: { vehicle: true },
  });
}

async function deleteExpense(id) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw new NotFoundError(`Expense '${id}' not found`);

  return prisma.expense.delete({ where: { id } });
}

module.exports = { createExpense, listExpenses, updateExpense, deleteExpense };
