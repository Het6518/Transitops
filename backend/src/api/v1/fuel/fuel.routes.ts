import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';
import * as controller from './fuel.controller';

const router = Router();

router.use(authenticate);

router.get('/statistics', requirePermission('fuel:read'), controller.getFuelStatistics);
router.get('/', requirePermission('fuel:read'), controller.getFuelLogs);
router.post('/', requirePermission('fuel:write'), controller.createFuelLog);
router.get('/:id', requirePermission('fuel:read'), controller.getFuelLogById);
router.put('/:id', requirePermission('fuel:write'), controller.updateFuelLog);
router.delete('/:id', requirePermission('fuel:delete'), controller.deleteFuelLog);

export default router;
