import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from './error.middleware';

/** Numeric priority for each role (higher = more privileged) */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  MANAGER: 60,
  DISPATCHER: 50,
  OPERATOR: 40,
  DRIVER: 20,
  VIEWER: 10,
};

// ============================================================
// Role-Based Access Control
// ============================================================

/** Allow only users whose role is in the given list */
export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access requires one of the following roles: ${roles.join(', ')}`,
      );
    }
    next();
  };

/** Allow users at or above the given role level */
export const requireMinRole =
  (minRole: UserRole) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();

    const userLevel = ROLE_HIERARCHY[req.user.role];
    const minLevel = ROLE_HIERARCHY[minRole];

    if (userLevel < minLevel) {
      throw new ForbiddenError(`Access requires at minimum the "${minRole}" role`);
    }
    next();
  };

// ============================================================
// Permission-Based Access Control
// ============================================================

/**
 * Require ALL listed permissions.
 * SUPER_ADMIN automatically bypasses all permission checks.
 */
export const requirePermission =
  (...permissionNames: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();

    // Super admin bypass
    if (req.user.role === 'SUPER_ADMIN') return next();

    const missing = permissionNames.filter(
      (p) => !req.user!.permissions.includes(p),
    );

    if (missing.length > 0) {
      throw new ForbiddenError(
        `Missing required permissions: ${missing.join(', ')}`,
      );
    }
    next();
  };

/**
 * Require ANY ONE of the listed permissions.
 * SUPER_ADMIN automatically bypasses.
 */
export const requireAnyPermission =
  (...permissionNames: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();

    if (req.user.role === 'SUPER_ADMIN') return next();

    const hasAny = permissionNames.some((p) =>
      req.user!.permissions.includes(p),
    );

    if (!hasAny) {
      throw new ForbiddenError('You do not have permission to perform this action');
    }
    next();
  };

/**
 * Shorthand for module:action permission.
 * Usage: can('fleet', 'create')
 */
export const can = (module: string, action: string) =>
  requirePermission(`${module}:${action}`);

/**
 * Check ownership — allows access if the resource belongs to the user
 * or if the user has admin-level role.
 */
export const requireOwnerOrRole =
  (getOwnerId: (req: Request) => string | undefined, ...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();

    const userLevel = ROLE_HIERARCHY[req.user.role];
    const hasRole = roles.some(
      (r) => ROLE_HIERARCHY[r] <= userLevel,
    );

    if (hasRole) return next();

    const ownerId = getOwnerId(req);
    if (ownerId && ownerId === req.user.id) return next();

    throw new ForbiddenError('You can only access your own resources');
  };
