import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { verifyAccessToken } from '../utils/jwt';
import { asyncHandler } from '../utils/asyncHandler';
import { UnauthorizedError } from './error.middleware';

/**
 * Authenticate — verifies JWT and attaches `req.user`.
 * Throws 401 if token is missing, invalid, or session is revoked.
 */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const token = authHeader.slice(7); // Remove "Bearer "
    const payload = verifyAccessToken(token);

    if (payload.type !== 'access') {
      throw new UnauthorizedError('Invalid token type');
    }

    // Verify session is active
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new UnauthorizedError('Session expired or revoked. Please login again.');
    }

    // Load user with their permissions
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        userPermissions: {
          where: {
            granted: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          include: { permission: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('User account not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError(
        `Account is ${user.status.toLowerCase()}. Please contact support.`,
      );
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.userPermissions.map((up) => up.permission.name),
      sessionId: session.id,
    };

    next();
  },
);

/**
 * Optional authenticate — sets req.user if a valid token is present,
 * but does NOT throw if no token is found.
 */
export const optionalAuthenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    try {
      const token = authHeader.slice(7);
      const payload = verifyAccessToken(token);

      const [session, user] = await Promise.all([
        prisma.session.findUnique({ where: { id: payload.sessionId } }),
        prisma.user.findUnique({
          where: { id: payload.sub },
          include: {
            userPermissions: {
              where: { granted: true },
              include: { permission: true },
            },
          },
        }),
      ]);

      if (session && !session.isRevoked && user && user.status === 'ACTIVE') {
        req.user = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          permissions: user.userPermissions.map((up) => up.permission.name),
          sessionId: session.id,
        };
      }
    } catch {
      // Silently ignore auth errors for optional auth
    }

    next();
  },
);
