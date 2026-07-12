import { z } from 'zod';
import { VehicleStatus } from '@prisma/client';

export const createVehicleSchema = z.object({
  plateNumber: z.string().min(3).max(15).regex(/^[A-Z0-9-]+$/, 'Invalid plate number format (letters, numbers, hyphens only)'),
  model: z.string().min(2).max(50),
  type: z.string().min(2).max(30),
  status: z.nativeEnum(VehicleStatus).optional(),
  fuelType: z.string().min(2).max(30),
  fuelCapacity: z.number().positive(),
  mileage: z.number().nonnegative().optional(),
});

export const updateVehicleSchema = z.object({
  plateNumber: z.string().min(3).max(15).regex(/^[A-Z0-9-]+$/, 'Invalid plate number format').optional(),
  model: z.string().min(2).max(50).optional(),
  type: z.string().min(2).max(30).optional(),
  status: z.nativeEnum(VehicleStatus).optional(),
  fuelType: z.string().min(2).max(30).optional(),
  fuelCapacity: z.number().positive().optional(),
  mileage: z.number().nonnegative().optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
