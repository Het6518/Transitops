import { Router, Request, Response } from 'express';
import { prisma } from '../../../config/database';
import { authenticate } from '../../../middleware/auth.middleware';
import { requirePermission, refreshPermissionCache } from '../../../middleware/permission.middleware';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/response';

const router = Router();

/**
 * @swagger
 * /permissions:
 *   get:
 *     tags: [Permissions]
 *     summary: Retrieve list of all system permissions
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/permissions',
  authenticate,
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { name: 'asc' }],
    });
    sendSuccess(res, permissions, 'Permissions retrieved successfully');
  }),
);

/**
 * @swagger
 * /admin/refresh-permissions:
 *   post:
 *     tags: [Permissions]
 *     summary: Refresh permission memory cache from database definitions
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/admin/refresh-permissions',
  authenticate,
  requirePermission('settings:update'),
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    await refreshPermissionCache();
    sendSuccess(res, null, 'Permission cache refreshed successfully');
  }),
);

export default router;
