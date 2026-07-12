import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/response';
import { prisma } from '../../../config/database';
import { env } from '../../../config/env';

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Get API and service health status
 *     security: []
 *     responses:
 *       200:
 *         description: Health status
 */
export const healthCheck = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    let dbStatus: 'healthy' | 'unhealthy' = 'healthy';
    let dbLatencyMs = 0;

    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
    } catch {
      dbStatus = 'unhealthy';
    }

    const mem = process.memoryUsage();

    const payload = {
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: env.APP_VERSION,
      environment: env.NODE_ENV,
      uptimeSeconds: Math.floor(process.uptime()),
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
      },
      memory: {
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
        rssMb: Math.round(mem.rss / 1024 / 1024),
      },
    };

    sendSuccess(res, payload, 'Health check passed');
  },
);
