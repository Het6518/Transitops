import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';
import * as controller from './users.controller';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('users:read'), controller.getUsers);
router.post('/', requirePermission('users:write'), controller.createUser);
router.put('/:id', requirePermission('users:write'), controller.updateUser);
router.delete('/:id', requirePermission('users:delete'), controller.deleteUser);
router.put('/:id/role', requirePermission('users:write'), controller.updateUserRole);

export default router;
