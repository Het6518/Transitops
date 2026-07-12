const { z } = require('zod');
const { zodMessage } = require('../utils/zodMessage');
const svc = require('../services/expense.service');

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  vehicleId: z.string().uuid('vehicleId must be a valid UUID'),
  type:      z.string().min(1, 'type is required'),
  amount:    z.number().positive('amount must be > 0'),
  date:      z.coerce.date().optional(),
}).strict();

const listQuerySchema = z.object({
  vehicleId: z.string().uuid('vehicleId must be a valid UUID').optional(),
});

// ─── Async Wrapper ────────────────────────────────────────────────────────────

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ─── Controllers ──────────────────────────────────────────────────────────────

/** POST /expenses */
const createExpense = asyncHandler(async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) } });
  }
  const expense = await svc.createExpense(parsed.data);
  return res.status(201).json(expense);
});

/** GET /expenses */
const listExpenses = asyncHandler(async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) } });
  }
  const expenses = await svc.listExpenses(parsed.data);
  return res.status(200).json(expenses);
});

module.exports = { createExpense, listExpenses };
