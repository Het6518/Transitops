import { z } from 'zod';

export const createExpenseSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  tripId: z.string().optional().nullable(),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().optional(),
  description: z.string().optional().nullable(),
});

export const updateExpenseSchema = z.object({
  vehicleId: z.string().optional(),
  tripId: z.string().optional().nullable(),
  category: z.string().optional(),
  amount: z.number().positive().optional(),
  date: z.string().optional(),
  description: z.string().optional().nullable(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
