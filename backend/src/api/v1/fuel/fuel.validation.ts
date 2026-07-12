import { z } from 'zod';

export const createFuelLogSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  tripId: z.string().optional().nullable(),
  driverId: z.string().min(1, 'Driver is required'),
  fuelType: z.string().min(1, 'Fuel type is required'),
  liters: z.number().positive('Liters must be positive'),
  cost: z.number().positive('Cost must be positive'),
  odometer: z.number().nonnegative('Odometer must be non-negative'),
  loggedAt: z.string().optional(),
});

export const updateFuelLogSchema = z.object({
  vehicleId: z.string().optional(),
  tripId: z.string().optional().nullable(),
  driverId: z.string().optional(),
  fuelType: z.string().optional(),
  liters: z.number().positive().optional(),
  cost: z.number().positive().optional(),
  odometer: z.number().nonnegative().optional(),
  loggedAt: z.string().optional(),
});

export type CreateFuelLogInput = z.infer<typeof createFuelLogSchema>;
export type UpdateFuelLogInput = z.infer<typeof updateFuelLogSchema>;
