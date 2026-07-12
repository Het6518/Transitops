import { Request, Response } from 'express';
import { prisma } from '../../../config/database';
import { sendSuccess, sendCreated } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { hashPassword } from '../../../utils/password';
import { UserRole, UserStatus } from '@prisma/client';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      phone: true,
      timezone: true,
      roleId: true,
      roleRelation: {
        select: { id: true, name: true, description: true }
      },
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });
  sendSuccess(res, users, 'Users retrieved successfully');
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, role, status, phone, timezone, roleId } = req.body;

  const hashedPassword = await hashPassword(password || 'TransitOps2026!');
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: (role as UserRole) || 'VIEWER',
      status: (status as UserStatus) || 'ACTIVE',
      phone,
      timezone: timezone || 'UTC',
      roleId: roleId || null
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      phone: true,
      timezone: true,
      roleId: true,
      createdAt: true
    }
  });

  // Log user creation
  await prisma.auditLog.create({
    data: {
      userId: req.user?.id || null,
      action: 'CREATE',
      module: 'users',
      entityId: user.id,
      entityType: 'User',
      newValues: JSON.stringify(user)
    }
  });

  sendCreated(res, user, 'User created successfully');
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { firstName, lastName, role, status, phone, timezone, roleId, password } = req.body;

  const updateData: any = {
    firstName,
    lastName,
    role: role as UserRole,
    status: status as UserStatus,
    phone,
    timezone,
    roleId: roleId || null
  };

  if (password) {
    updateData.password = await hashPassword(password);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      phone: true,
      timezone: true,
      roleId: true
    }
  });

  // Log update
  await prisma.auditLog.create({
    data: {
      userId: req.user?.id || null,
      action: 'UPDATE',
      module: 'users',
      entityId: user.id,
      entityType: 'User',
      newValues: JSON.stringify(user)
    }
  });

  sendSuccess(res, user, 'User updated successfully');
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.user.delete({ where: { id } });

  // Log delete
  await prisma.auditLog.create({
    data: {
      userId: req.user?.id || null,
      action: 'DELETE',
      module: 'users',
      entityId: id,
      entityType: 'User'
    }
  });

  sendSuccess(res, null, 'User deleted successfully');
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, roleId } = req.body;

  const user = await prisma.user.update({
    where: { id },
    data: {
      role: role as UserRole,
      roleId: roleId || null
    },
    select: {
      id: true,
      email: true,
      role: true,
      roleId: true
    }
  });

  // Log role update
  await prisma.auditLog.create({
    data: {
      userId: req.user?.id || null,
      action: 'PERMISSION_CHANGE',
      module: 'users',
      entityId: id,
      entityType: 'User',
      newValues: JSON.stringify(user)
    }
  });

  sendSuccess(res, user, 'User role updated successfully');
});
