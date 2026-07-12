import { Request, Response } from 'express';
import { prisma } from '../../../config/database';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.auditLog.count()
  ]);

  sendSuccess(res, data, 'Audit logs retrieved successfully', 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  });
});
