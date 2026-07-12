import { Request, Response } from 'express';
import { ExpenseService } from './expenses.service';
import { createExpenseSchema, updateExpenseSchema } from './expenses.validation';
import { sendSuccess, sendCreated } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';

const service = new ExpenseService();

export const getExpenses = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const vehicleId = req.query.vehicleId as string;
  const category = req.query.category as string;

  const result = await service.getExpenses({ page, limit, vehicleId, category });
  sendSuccess(res, result.data, 'Expenses retrieved successfully', 200, result.meta);
});

export const getExpenseStatistics = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await service.getStatistics();
  sendSuccess(res, stats, 'Expense statistics retrieved successfully');
});

export const getExpenseById = asyncHandler(async (req: Request, res: Response) => {
  const record = await service.getExpenseById(req.params.id);
  sendSuccess(res, record, 'Expense retrieved successfully');
});

export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  const validated = createExpenseSchema.parse(req.body);
  const record = await service.createExpense(validated);
  sendCreated(res, record, 'Expense created successfully');
});

export const updateExpense = asyncHandler(async (req: Request, res: Response) => {
  const validated = updateExpenseSchema.parse(req.body);
  const record = await service.updateExpense(req.params.id, validated);
  sendSuccess(res, record, 'Expense updated successfully');
});

export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteExpense(req.params.id);
  sendSuccess(res, null, 'Expense deleted successfully');
});
