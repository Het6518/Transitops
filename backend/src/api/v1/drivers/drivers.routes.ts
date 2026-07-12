import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';
import * as controller from './drivers.controller';

const router = Router();

// All driver routes require authentication
router.use(authenticate);

// Special routes BEFORE /:id to avoid param collision
router.get('/available', requirePermission('drivers:read'), controller.getAvailableDrivers);
router.get('/statistics', requirePermission('drivers:read'), controller.getDriverStatistics);

// CRUD routes
router.get('/', requirePermission('drivers:read'), controller.getDrivers);
router.get('/:id', requirePermission('drivers:read'), controller.getDriverById);
router.post('/', requirePermission('drivers:create'), controller.createDriver);
router.put('/:id', requirePermission('drivers:update'), controller.updateDriver);
router.delete('/:id', requirePermission('drivers:delete'), controller.deleteDriver);

export default router;
