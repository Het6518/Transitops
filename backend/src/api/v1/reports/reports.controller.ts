import { Request, Response } from 'express';
import { ReportsService } from './reports.service';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';

const service = new ReportsService();

export const getOverview = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await service.getOverview();
  sendSuccess(res, stats, 'Executive reports overview retrieved successfully');
});

export const getFleetReports = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await service.getFleetReports();
  sendSuccess(res, stats, 'Fleet reports retrieved successfully');
});

export const getExpensesReports = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await service.getExpensesReports();
  sendSuccess(res, stats, 'Expenses reports retrieved successfully');
});

export const getFuelReports = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await service.getFuelReports();
  sendSuccess(res, stats, 'Fuel reports retrieved successfully');
});

export const getDriverReports = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await service.getDriverReports();
  sendSuccess(res, stats, 'Driver reports retrieved successfully');
});

export const getTripReports = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await service.getTripReports();
  sendSuccess(res, stats, 'Trip reports retrieved successfully');
});

export const exportCSV = asyncHandler(async (_req: Request, res: Response) => {
  const csv = await service.exportCSV();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=transitops-reports.csv');
  res.status(200).send(csv);
});

export const exportPDF = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.exportPDF();
  sendSuccess(res, data, 'PDF reports metadata generated successfully');
});
