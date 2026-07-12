const { z } = require('zod');
const { zodMessage } = require('../utils/zodMessage');
const svc = require('../services/maintenance.service');

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const openSchema = z.object({
  vehicleId:   z.string().uuid('vehicleId must be a valid UUID'),
  description: z.string().min(1, 'description is required'),
  cost:        z.number().min(0, 'cost must be >= 0').optional(),
});

const closeSchema = z.object({
  cost:        z.number().min(0, 'cost must be >= 0').optional(),
  description: z.string().optional(),
}).strict();

const listQuerySchema = z.object({
  vehicleId: z.string().uuid('vehicleId must be a valid UUID').optional(),
});

// ─── Async Wrapper ────────────────────────────────────────────────────────────

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ─── Controllers ──────────────────────────────────────────────────────────────

/** POST /maintenance (Open Maintenance) */
const openMaintenance = asyncHandler(async (req, res) => {
  const parsed = openSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) } });
  }
  const log = await svc.openMaintenance(parsed.data, req.user.userId);
  return res.status(201).json(log);
});

/** PATCH /maintenance/:id/close (Close Maintenance) */
const closeMaintenance = asyncHandler(async (req, res) => {
  const parsed = closeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) } });
  }
  const log = await svc.closeMaintenance(req.params.id, parsed.data, req.user.userId);
  return res.status(200).json(log);
});

/** GET /maintenance */
const listMaintenance = asyncHandler(async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) } });
  }
  const logs = await svc.listMaintenance(parsed.data);
  return res.status(200).json(logs);
});

module.exports = { openMaintenance, closeMaintenance, listMaintenance };
