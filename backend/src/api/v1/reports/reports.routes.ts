import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';
import * as controller from './reports.controller';

const router = Router();

router.use(authenticate);

router.get('/export/csv', requirePermission('reports:read'), controller.exportCSV);
router.get('/export/pdf', requirePermission('reports:read'), controller.exportPDF);

router.get('/fleet', requirePermission('reports:read'), controller.getFleetReports);
router.get('/expenses', requirePermission('reports:read'), controller.getExpensesReports);
router.get('/fuel', requirePermission('reports:read'), controller.getFuelReports);
router.get('/drivers', requirePermission('reports:read'), controller.getDriverReports);
router.get('/trips', requirePermission('reports:read'), controller.getTripReports);
router.get('/', requirePermission('reports:read'), controller.getOverview);

export default router;
