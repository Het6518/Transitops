import { z } from 'zod';
import { MaintenanceStatus } from '@prisma/client';

export const createMaintenanceSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  serviceType: z.string().min(1, 'Service type is required'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  cost: z.number().min(0, 'Cost must be a positive number'),
  status: z.nativeEnum(MaintenanceStatus).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional().nullable(),
});

export const updateMaintenanceSchema = z.object({
  serviceType: z.string().min(1, 'Service type is required').optional(),
  description: z.string().min(5, 'Description must be at least 5 characters').optional(),
  cost: z.number().min(0, 'Cost must be a positive number').optional(),
  status: z.nativeEnum(MaintenanceStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional().nullable(),
});
