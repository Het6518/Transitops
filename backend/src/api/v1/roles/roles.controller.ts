import { Request, Response } from 'express';
import { prisma } from '../../../config/database';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';

export const getRoles = asyncHandler(async (req: Request, res: Response) => {
  const roles = await prisma.role.findMany({
    include: {
      rolePermissions: {
        include: { permission: true }
      }
    },
    orderBy: { name: 'asc' }
  });
  sendSuccess(res, roles, 'Roles retrieved successfully');
});

export const getPermissions = asyncHandler(async (req: Request, res: Response) => {
  const permissions = await prisma.permission.findMany({
    orderBy: { module: 'asc' }
  });
  sendSuccess(res, permissions, 'Permissions retrieved successfully');
});

export const updateRolePermissions = asyncHandler(async (req: Request, res: Response) => {
  const { id: roleId } = req.params;
  const { permissionIds } = req.body; // Array of permission ID strings

  await prisma.$transaction(async (tx) => {
    // 1. Delete all existing permissions for the role
    await tx.rolePermission.deleteMany({
      where: { roleId }
    });

    // 2. Insert new permissions mappings
    if (permissionIds && permissionIds.length > 0) {
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId: string) => ({
          roleId,
          permissionId
        }))
      });
    }
  });

  // Log permissions matrix update
  await prisma.auditLog.create({
    data: {
      userId: req.user?.id || null,
      action: 'PERMISSION_CHANGE',
      module: 'roles',
      entityId: roleId,
      entityType: 'Role',
      newValues: JSON.stringify({ permissionIds })
    }
  });

  sendSuccess(res, null, 'Role permissions updated successfully');
});
