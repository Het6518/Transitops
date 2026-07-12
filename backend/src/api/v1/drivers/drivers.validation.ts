import { z } from 'zod';
import { DriverStatus } from '@prisma/client';

export const createDriverSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  contactNumber: z.string().min(7).max(20),
  licenseNumber: z.string().min(5).max(30),
  licenseCategory: z.enum(['A', 'B', 'C', 'D', 'E', 'B+E', 'C+E', 'D+E']),
  licenseExpiry: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  status: z.nativeEnum(DriverStatus).optional(),
  safetyScore: z.number().min(0).max(100).optional(),
  address: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});

export const updateDriverSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  contactNumber: z.string().min(7).max(20).optional(),
  licenseNumber: z.string().min(5).max(30).optional(),
  licenseCategory: z.enum(['A', 'B', 'C', 'D', 'E', 'B+E', 'C+E', 'D+E']).optional(),
  licenseExpiry: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  status: z.nativeEnum(DriverStatus).optional(),
  safetyScore: z.number().min(0).max(100).optional(),
  address: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
