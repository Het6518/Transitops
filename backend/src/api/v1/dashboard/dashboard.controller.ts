import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';

const service = new DashboardService();

export const getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await service.getDashboardSummary();
  sendSuccess(res, summary, 'Dashboard summary retrieved successfully');
});

export const getKPIs = asyncHandler(async (req: Request, res: Response) => {
  const kpis = await service.getKPIs();
  sendSuccess(res, kpis, 'KPIs retrieved successfully');
});

export const getActivityTimeline = asyncHandler(async (req: Request, res: Response) => {
  const activity = await service.getActivityTimeline();
  sendSuccess(res, activity, 'Activity timeline retrieved successfully');
});

export const getCharts = asyncHandler(async (req: Request, res: Response) => {
  const charts = await service.getCharts();
  sendSuccess(res, charts, 'Charts retrieved successfully');
});
