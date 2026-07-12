import { Router } from 'express';
import { healthCheck } from './health.controller';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: API health check
 *     security: []
 */
router.get('/', healthCheck);

export default router;
