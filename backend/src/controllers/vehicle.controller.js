const { z }          = require('zod');
const { zodMessage } = require('../utils/zodMessage');
const svc            = require('../services/vehicle.service');

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const VEHICLE_STATUS = z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']);

const createSchema = z.object({
  regNo:          z.string().min(1, 'regNo is required'),
  name:           z.string().min(1, 'name is required'),
  type:           z.string().min(1, 'type is required'),
  maxLoadKg:      z.number({ required_error: 'maxLoadKg is required' }).positive('maxLoadKg must be > 0'),
  odometer:       z.number().min(0, 'odometer must be >= 0').default(0),
  acquisitionCost: z.number({ required_error: 'acquisitionCost is required' }).positive('acquisitionCost must be > 0'),
});

const updateSchema = z.object({
  regNo:           z.string().min(1).optional(),
  name:            z.string().min(1).optional(),
  type:            z.string().min(1).optional(),
  maxLoadKg:       z.number().positive('maxLoadKg must be > 0').optional(),
  odometer:        z.number().min(0, 'odometer must be >= 0').optional(),
  acquisitionCost: z.number().positive('acquisitionCost must be > 0').optional(),
  status:          VEHICLE_STATUS.optional(),
}).strict(); // reject unknown fields

const listQuerySchema = z.object({
  status: VEHICLE_STATUS.optional(),
  type:   z.string().optional(),
  search: z.string().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalize regNo: trim whitespace + uppercase */
function normalizeRegNo(regNo) {
  return regNo.trim().toUpperCase();
}

/** Wrap async controller and forward errors to Express error handler */
const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /vehicles
 * Body: { regNo, name, type, maxLoadKg, odometer?, acquisitionCost }
 */
const createVehicle = asyncHandler(async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) } });
  }

  const data = { ...parsed.data, regNo: normalizeRegNo(parsed.data.regNo) };
  const vehicle = await svc.createVehicle(data);
  return res.status(201).json(vehicle);
});

/**
 * GET /vehicles
 * Query: ?status=AVAILABLE&type=truck
 */
const listVehicles = asyncHandler(async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) } });
  }

  const vehicles = await svc.listVehicles(parsed.data);
  return res.status(200).json(vehicles);
});

/**
 * GET /vehicles/:id
 */
const getVehicle = asyncHandler(async (req, res) => {
  const vehicle = await svc.getVehicleById(req.params.id);
  return res.status(200).json(vehicle);
});

/**
 * PATCH /vehicles/:id
 * Body: partial vehicle fields
 */
const updateVehicle = asyncHandler(async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) } });
  }

  // Normalize regNo if present
  const data = parsed.data;
  if (data.regNo) data.regNo = normalizeRegNo(data.regNo);

  const vehicle = await svc.updateVehicle(req.params.id, data, req.user.userId);
  return res.status(200).json(vehicle);
});

/**
 * DELETE /vehicles/:id
 */
const deleteVehicle = asyncHandler(async (req, res) => {
  await svc.deleteVehicle(req.params.id);
  return res.status(204).send();
});

module.exports = { createVehicle, listVehicles, getVehicle, updateVehicle, deleteVehicle };
