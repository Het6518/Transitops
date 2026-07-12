import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import * as controller from './dashboard.controller';

const router = Router();

// All dashboard endpoints require authentication
router.use(authenticate);

/**
 * @swagger
 * /dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get overall dashboard summary (KPIs, activities, and charts combined)
 *     security:
 *       - bearerAuth: []
 */
router.get('/', controller.getDashboardSummary);

/**
 * @swagger
 * /dashboard/kpis:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get Executive KPI statistics
 *     security:
 *       - bearerAuth: []
 */
router.get('/kpis', controller.getKPIs);

/**
 * @swagger
 * /dashboard/activity:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get recent activity timeline log
 *     security:
 *       - bearerAuth: []
 */
router.get('/activity', controller.getActivityTimeline);

/**
 * @swagger
 * /dashboard/charts:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get aggregated chart data trends
 *     security:
 *       - bearerAuth: []
 */
router.get('/charts', controller.getCharts);

export default router;
