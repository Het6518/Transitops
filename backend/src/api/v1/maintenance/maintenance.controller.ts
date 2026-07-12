import { Request, Response } from 'express';
import { MaintenanceService } from './maintenance.service';
import { createMaintenanceSchema, updateMaintenanceSchema } from './maintenance.validation';
import { sendSuccess, sendCreated, sendError } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';

const service = new MaintenanceService();

export const getMaintenanceRecords = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const vehicleId = req.query.vehicleId as string;

  const result = await service.getMaintenanceRecords({ page, limit, status, vehicleId });
  sendSuccess(res, result, 'Maintenance records retrieved successfully');
});

export const getMaintenanceStatistics = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await service.getStatistics();
  sendSuccess(res, stats, 'Maintenance statistics retrieved successfully');
});

export const getMaintenanceById = asyncHandler(async (req: Request, res: Response) => {
  const record = await service.getMaintenanceById(req.params.id);
  sendSuccess(res, record, 'Maintenance record retrieved successfully');
});

export const createMaintenance = asyncHandler(async (req: Request, res: Response) => {
  const validated = createMaintenanceSchema.parse(req.body);
  const userId = req.user!.id; // Authenticated user
  const record = await service.createMaintenance({ ...validated, userId });
  sendCreated(res, record, 'Maintenance record created successfully');
});

export const updateMaintenance = asyncHandler(async (req: Request, res: Response) => {
  const validated = updateMaintenanceSchema.parse(req.body);
  const record = await service.updateMaintenance(req.params.id, validated);
  sendSuccess(res, record, 'Maintenance record updated successfully');
});

export const completeMaintenance = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const record = await service.completeMaintenance(req.params.id, userId);
  sendSuccess(res, record, 'Maintenance marked as completed');
});

export const deleteMaintenance = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteMaintenance(req.params.id);
  sendSuccess(res, null, 'Maintenance record deleted successfully');
});
