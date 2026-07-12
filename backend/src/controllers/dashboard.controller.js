const { z } = require('zod');
const { zodMessage } = require('../utils/zodMessage');
const svc = require('../services/report.service');

const VEHICLE_STATUS = z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']);

const querySchema = z.object({
  vehicleType: z.string().optional(),
  status:      VEHICLE_STATUS.optional(),
});

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

/** GET /dashboard */
const getDashboard = asyncHandler(async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) } });
  }

  const kpis = await svc.getDashboardKPIs(parsed.data);
  return res.status(200).json(kpis);
});

module.exports = { getDashboard };
