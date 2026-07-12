import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';
import * as controller from './audit.controller';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('audit:read'), controller.getAuditLogs);

export default router;
