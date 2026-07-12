import { Request, Response } from 'express';
import { TripsService } from './trips.service';
import { createTripSchema, updateTripSchema } from './trips.validation';
import { sendSuccess, sendCreated, sendError } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { TripStatus } from '@prisma/client';
import { prisma } from '../../../config/database';

const service = new TripsService();

export const getTrips = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, vehicleId, driverId, sortBy, sortOrder, page, limit } = req.query;

  const result = await service.getTrips({
    search: search as string,
    status: status as TripStatus,
    vehicleId: vehicleId as string,
    driverId: driverId as string,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  sendSuccess(res, result.items, 'Trips retrieved successfully', 200, {
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  });
});

export const getTripById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const trip = await service.getTripById(id);
    sendSuccess(res, trip, 'Trip details retrieved successfully');
  } catch (error: any) {
    sendError(res, error.message, 404);
  }
});

export const getTripStatistics = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await service.getStatistics();
  sendSuccess(res, stats, 'Trip statistics retrieved successfully');
});

export const createTrip = asyncHandler(async (req: Request, res: Response) => {
  const validation = createTripSchema.safeParse(req.body);
  if (!validation.success) {
    return sendError(res, 'Validation error', 400, validation.error.flatten());
  }

  try {
    const userId = (req as any).user?.id;
    const trip = await service.createTrip({ ...validation.data, userId });
    sendCreated(res, trip, 'Trip logged as draft successfully');
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
});

export const updateTrip = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validation = updateTripSchema.safeParse(req.body);
  if (!validation.success) {
    return sendError(res, 'Validation error', 400, validation.error.flatten());
  }

  try {
    const trip = await service.updateTrip(id, validation.data);
    sendSuccess(res, trip, 'Trip draft updated successfully');
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
});

export const dispatchTrip = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const trip = await service.dispatchTrip(id);
    sendSuccess(res, trip, 'Trip dispatched successfully');
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
});

export const completeTrip = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { actualDistance } = req.body;
  try {
    const trip = await service.completeTrip(id, actualDistance ? Number(actualDistance) : undefined);
    sendSuccess(res, trip, 'Trip completed successfully');
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
});

export const cancelTrip = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const trip = await service.cancelTrip(id);
    sendSuccess(res, trip, 'Trip cancelled successfully');
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
});

export const deleteTrip = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await service.deleteTrip(id);
    sendSuccess(res, null, 'Trip deleted successfully');
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
});

export const getRoutes = asyncHandler(async (_req: Request, res: Response) => {
  const routes = await prisma.route.findMany({
    orderBy: { name: 'asc' },
  });
  sendSuccess(res, routes, 'Routes retrieved successfully');
});
