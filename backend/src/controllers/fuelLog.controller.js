const { z } = require('zod');
const { zodMessage } = require('../utils/zodMessage');
const svc = require('../services/fuelLog.service');

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  vehicleId: z.string().uuid('vehicleId must be a valid UUID'),
  liters:    z.number().positive('liters must be > 0'),
  cost:      z.number().positive('cost must be > 0'),
  date:      z.coerce.date().optional(),
}).strict();

const listQuerySchema = z.object({
  vehicleId: z.string().uuid('vehicleId must be a valid UUID').optional(),
});

const updateSchema = z.object({
  vehicleId: z.string().uuid('vehicleId must be a valid UUID').optional(),
  liters:    z.number().positive('liters must be > 0').optional(),
  cost:      z.number().positive('cost must be > 0').optional(),
  date:      z.coerce.date().optional(),
}).strict();

// ─── Async Wrapper ────────────────────────────────────────────────────────────

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ─── Controllers ──────────────────────────────────────────────────────────────

/** POST /fuel-logs */
const createFuelLog = asyncHandler(async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) } });
  }
  const log = await svc.createFuelLog(parsed.data);
  return res.status(201).json(log);
});

/** GET /fuel-logs */
const listFuelLogs = asyncHandler(async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) } });
  }
  const logs = await svc.listFuelLogs(parsed.data);
  return res.status(200).json(logs);
});

/** PATCH /fuel-logs/:id */
const updateFuelLog = asyncHandler(async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) } });
  }
  const log = await svc.updateFuelLog(req.params.id, parsed.data);
  return res.status(200).json(log);
});

/** DELETE /fuel-logs/:id */
const deleteFuelLog = asyncHandler(async (req, res) => {
  await svc.deleteFuelLog(req.params.id);
  return res.status(204).send();
});

module.exports = { createFuelLog, listFuelLogs, updateFuelLog, deleteFuelLog };
