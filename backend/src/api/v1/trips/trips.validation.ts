import { z } from 'zod';
import { TripStatus } from '@prisma/client';

export const createTripSchema = z.object({
  vehicleId: z.string().cuid(),
  driverId: z.string().cuid(),
  routeId: z.string().cuid(),
  cargoWeight: z.number().positive(),
  cargoDescription: z.string().min(3).max(100),
  estimatedCost: z.number().positive().optional(),
  estimatedFuel: z.number().positive().optional(),
});

export const updateTripSchema = z.object({
  vehicleId: z.string().cuid().optional(),
  driverId: z.string().cuid().optional(),
  routeId: z.string().cuid().optional(),
  status: z.nativeEnum(TripStatus).optional(),
  cargoWeight: z.number().positive().optional(),
  cargoDescription: z.string().min(3).max(100).optional(),
  estimatedCost: z.number().positive().optional(),
  estimatedFuel: z.number().positive().optional(),
  actualDistance: z.number().positive().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
