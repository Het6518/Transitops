import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';
import * as controller from './roles.controller';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('users:read'), controller.getRoles);
router.get('/permissions', requirePermission('users:read'), controller.getPermissions);
router.put('/:id/permissions', requirePermission('users:write'), controller.updateRolePermissions);

export default router;
