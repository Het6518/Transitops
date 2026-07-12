import { Request, Response } from 'express';
import { DriversService } from './drivers.service';
import { createDriverSchema, updateDriverSchema } from './drivers.validation';
import { sendSuccess, sendCreated, sendError, buildPaginationMeta } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { DriverStatus } from '@prisma/client';

const service = new DriversService();

/**
 * @swagger
 * /drivers:
 *   get:
 *     tags: [Drivers]
 *     summary: Get paginated list of drivers
 *     security:
 *       - bearerAuth: []
 */
export const getDrivers = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, licenseCategory, sortBy, sortOrder, page, limit } = req.query;

  const result = await service.getDrivers({
    search: search as string,
    status: status as DriverStatus,
    licenseCategory: licenseCategory as string,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  const meta = buildPaginationMeta(result.page, result.limit, result.total);

  sendSuccess(res, result.items, 'Drivers retrieved successfully', 200, meta);
});

/**
 * @swagger
 * /drivers/available:
 *   get:
 *     tags: [Drivers]
 *     summary: Get all available drivers (for trip assignment)
 *     security:
 *       - bearerAuth: []
 */
export const getAvailableDrivers = asyncHandler(async (_req: Request, res: Response) => {
  const drivers = await service.getAvailableDrivers();
  sendSuccess(res, drivers, 'Available drivers retrieved successfully');
});

/**
 * @swagger
 * /drivers/statistics:
 *   get:
 *     tags: [Drivers]
 *     summary: Get driver statistics summary
 *     security:
 *       - bearerAuth: []
 */
export const getDriverStatistics = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await service.getStatistics();
  sendSuccess(res, stats, 'Driver statistics retrieved successfully');
});

/**
 * @swagger
 * /drivers/{id}:
 *   get:
 *     tags: [Drivers]
 *     summary: Get driver by ID with trip history
 *     security:
 *       - bearerAuth: []
 */
export const getDriverById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const driver = await service.getDriverById(id);
    sendSuccess(res, driver, 'Driver details retrieved successfully');
  } catch (error: any) {
    sendError(res, error.message, 404);
  }
});

/**
 * @swagger
 * /drivers:
 *   post:
 *     tags: [Drivers]
 *     summary: Register a new driver
 *     security:
 *       - bearerAuth: []
 */
export const createDriver = asyncHandler(async (req: Request, res: Response) => {
  const validation = createDriverSchema.safeParse(req.body);
  if (!validation.success) {
    return sendError(res, 'Validation error', 400, validation.error.flatten());
  }

  try {
    const driver = await service.createDriver(validation.data);
    sendCreated(res, driver, 'Driver registered successfully');
  } catch (error: any) {
    sendError(res, error.message, 409);
  }
});

/**
 * @swagger
 * /drivers/{id}:
 *   put:
 *     tags: [Drivers]
 *     summary: Update driver details
 *     security:
 *       - bearerAuth: []
 */
export const updateDriver = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validation = updateDriverSchema.safeParse(req.body);
  if (!validation.success) {
    return sendError(res, 'Validation error', 400, validation.error.flatten());
  }

  try {
    const driver = await service.updateDriver(id, validation.data);
    sendSuccess(res, driver, 'Driver updated successfully');
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
});

/**
 * @swagger
 * /drivers/{id}:
 *   delete:
 *     tags: [Drivers]
 *     summary: Delete a driver
 *     security:
 *       - bearerAuth: []
 */
export const deleteDriver = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await service.deleteDriver(id);
    sendSuccess(res, null, 'Driver deleted successfully');
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
});
