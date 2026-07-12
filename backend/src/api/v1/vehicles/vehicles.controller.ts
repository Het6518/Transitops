import { Request, Response } from 'express';
import { VehiclesService } from './vehicles.service';
import { createVehicleSchema, updateVehicleSchema } from './vehicles.validation';
import { sendSuccess, sendCreated, sendError } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { VehicleStatus } from '@prisma/client';

const service = new VehiclesService();

export const getVehicles = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, type, sortBy, sortOrder, page, limit } = req.query;

  const result = await service.getVehicles({
    search: search as string,
    status: status as VehicleStatus,
    type: type as string,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  sendSuccess(res, result.items, 'Vehicles retrieved successfully', 200, {
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  });
});

export const getVehicleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const vehicle = await service.getVehicleById(id);
    sendSuccess(res, vehicle, 'Vehicle details retrieved successfully');
  } catch (error: any) {
    sendError(res, error.message, 404);
  }
});

export const createVehicle = asyncHandler(async (req: Request, res: Response) => {
  const validation = createVehicleSchema.safeParse(req.body);
  if (!validation.success) {
    return sendError(res, 'Validation error', 400, validation.error.flatten());
  }

  try {
    const vehicle = await service.createVehicle(validation.data);
    sendCreated(res, vehicle, 'Vehicle registered successfully');
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
});

export const updateVehicle = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validation = updateVehicleSchema.safeParse(req.body);
  if (!validation.success) {
    return sendError(res, 'Validation error', 400, validation.error.flatten());
  }

  try {
    const vehicle = await service.updateVehicle(id, validation.data);
    sendSuccess(res, vehicle, 'Vehicle updated successfully');
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
});

export const deleteVehicle = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await service.deleteVehicle(id);
    sendSuccess(res, null, 'Vehicle deleted successfully');
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
});
