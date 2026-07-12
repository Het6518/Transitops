import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';
import * as controller from './maintenance.controller';

const router = Router();

router.use(authenticate);

// Special routes
router.get('/statistics', requirePermission('maintenance:read'), controller.getMaintenanceStatistics);

// Core CRUD
router.get('/', requirePermission('maintenance:read'), controller.getMaintenanceRecords);
router.post('/', requirePermission('maintenance:write'), controller.createMaintenance);

router.get('/:id', requirePermission('maintenance:read'), controller.getMaintenanceById);
router.put('/:id', requirePermission('maintenance:write'), controller.updateMaintenance);
router.delete('/:id', requirePermission('maintenance:delete'), controller.deleteMaintenance);

// Lifecycle actions
router.post('/:id/complete', requirePermission('maintenance:write'), controller.completeMaintenance);

export default router;
