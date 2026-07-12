import { Request, Response } from 'express';
import { FuelService } from './fuel.service';
import { createFuelLogSchema, updateFuelLogSchema } from './fuel.validation';
import { sendSuccess, sendCreated, buildPaginationMeta } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';

const service = new FuelService();

export const getFuelLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const vehicleId = req.query.vehicleId as string;
  const driverId = req.query.driverId as string;

  const result = await service.getFuelLogs({ page, limit, vehicleId, driverId });
  sendSuccess(res, result.data, 'Fuel logs retrieved successfully', 200, result.meta);
});

export const getFuelStatistics = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await service.getStatistics();
  sendSuccess(res, stats, 'Fuel statistics retrieved successfully');
});

export const getFuelLogById = asyncHandler(async (req: Request, res: Response) => {
  const record = await service.getFuelLogById(req.params.id);
  sendSuccess(res, record, 'Fuel log retrieved successfully');
});

export const createFuelLog = asyncHandler(async (req: Request, res: Response) => {
  const validated = createFuelLogSchema.parse(req.body);
  const userId = req.user!.id;
  const record = await service.createFuelLog({ ...validated, userId });
  sendCreated(res, record, 'Fuel log created successfully');
});

export const updateFuelLog = asyncHandler(async (req: Request, res: Response) => {
  const validated = updateFuelLogSchema.parse(req.body);
  const record = await service.updateFuelLog(req.params.id, validated);
  sendSuccess(res, record, 'Fuel log updated successfully');
});

export const deleteFuelLog = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteFuelLog(req.params.id);
  sendSuccess(res, null, 'Fuel log deleted successfully');
});
