const { z }          = require('zod');
const { zodMessage } = require('../utils/zodMessage');
const svc            = require('../services/driver.service');
const { checkAndSendLicenseExpiryReminders } = require('../cron');

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const DRIVER_STATUS = z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']);

// Phone: optional leading +, then 10–15 digits
const CONTACT_REGEX = /^\+?[0-9]{10,15}$/;

const createSchema = z.object({
  name:            z.string().min(1, 'name is required'),
  email:           z.string().email('email must be a valid email address').optional().nullable(),
  licenseNo:       z.string().min(1, 'licenseNo is required'),
  licenseCategory: z.string().min(1, 'licenseCategory is required'),
  licenseExpiry:   z.coerce.date({ required_error: 'licenseExpiry is required' }),
  contact:         z.string().regex(CONTACT_REGEX, 'contact must be a valid phone number (10–15 digits, optional leading +)'),
  safetyScore:     z.number()
    .min(0, 'safetyScore must be >= 0')
    .max(100, 'safetyScore must be <= 100')
    .default(100),
});

const updateSchema = z.object({
  name:            z.string().min(1).optional(),
  email:           z.string().email('email must be a valid email address').optional().nullable(),
  licenseNo:       z.string().min(1).optional(),
  licenseCategory: z.string().min(1).optional(),
  licenseExpiry:   z.coerce.date().optional(),
  contact:         z.string().regex(CONTACT_REGEX, 'contact must be a valid phone number (10–15 digits, optional leading +)').optional(),
  safetyScore:     z.number().min(0, 'safetyScore must be >= 0').max(100, 'safetyScore must be <= 100').optional(),
  status:          DRIVER_STATUS.optional(),
}).strict();

const listQuerySchema = z.object({
  status: DRIVER_STATUS.optional(),
});

// ─── Async wrapper ────────────────────────────────────────────────────────────

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /drivers
 */
const createDriver = asyncHandler(async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) } });
  }

  const driver = await svc.createDriver(parsed.data);
  return res.status(201).json(driver);
});

/**
 * GET /drivers?status=
 */
const listDrivers = asyncHandler(async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) } });
  }

  const drivers = await svc.listDrivers(parsed.data);
  return res.status(200).json(drivers);
});

/**
 * GET /drivers/:id
 */
const getDriver = asyncHandler(async (req, res) => {
  const driver = await svc.getDriverById(req.params.id);
  return res.status(200).json(driver);
});

/**
 * PATCH /drivers/:id
 */
const updateDriver = asyncHandler(async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) } });
  }

  const driver = await svc.updateDriver(req.params.id, parsed.data);
  return res.status(200).json(driver);
});

/**
 * DELETE /drivers/:id
 */
const deleteDriver = asyncHandler(async (req, res) => {
  await svc.deleteDriver(req.params.id);
  return res.status(204).send();
});

/**
 * POST /drivers/send-expiry-reminders
 */
const triggerExpiryReminders = asyncHandler(async (req, res) => {
  const sentDrivers = await checkAndSendLicenseExpiryReminders();
  return res.status(200).json({
    message: `License expiry reminders process completed successfully. Sent to ${sentDrivers.length} driver(s).`,
    drivers: sentDrivers
  });
});

module.exports = { createDriver, listDrivers, getDriver, updateDriver, deleteDriver, triggerExpiryReminders };
