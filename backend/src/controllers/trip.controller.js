const { z }          = require('zod');
const { zodMessage } = require('../utils/zodMessage');
const svc            = require('../services/trip.service');

const TRIP_STATUS = z.enum(['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED']);

const createSchema = z.object({
  source:          z.string().min(1, 'source is required'),
  destination:     z.string().min(1, 'destination is required'),
  vehicleId:       z.string().uuid('vehicleId must be a valid UUID'),
  driverId:        z.string().uuid('driverId must be a valid UUID'),
  cargoWeightKg:   z.number().positive('cargoWeightKg must be > 0'),
  plannedDistance: z.number().positive('plannedDistance must be > 0'),
});

const updateSchema = z.object({
  source:          z.string().min(1).optional(),
  destination:     z.string().min(1).optional(),
  plannedDistance: z.number().positive().optional(),
}).strict();

const completeSchema = z.object({
  actualOdometer: z.number().min(0, 'actualOdometer must be >= 0'),
  fuelConsumed:   z.number().positive('fuelConsumed must be > 0'),
});

const listQuerySchema = z.object({
  status: TRIP_STATUS.optional(),
});

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const createTrip = asyncHandler(async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) } });
  return res.status(201).json(await svc.createTrip(parsed.data));
});

const listTrips = asyncHandler(async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) } });
  return res.status(200).json(await svc.listTrips(parsed.data));
});

const getTrip = asyncHandler(async (req, res) =>
  res.status(200).json(await svc.getTripById(req.params.id))
);

const updateTrip = asyncHandler(async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) } });
  return res.status(200).json(await svc.updateTrip(req.params.id, parsed.data));
});

const dispatchTrip = asyncHandler(async (req, res) =>
  res.status(200).json(await svc.dispatchTrip(req.params.id, req.user.userId))
);

const completeTrip = asyncHandler(async (req, res) => {
  const parsed = completeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) } });
  return res.status(200).json(await svc.completeTrip(req.params.id, parsed.data, req.user.userId));
});

const cancelTrip = asyncHandler(async (req, res) =>
  res.status(200).json(await svc.cancelTrip(req.params.id, req.user.userId))
);

module.exports = { createTrip, listTrips, getTrip, updateTrip, dispatchTrip, completeTrip, cancelTrip };
