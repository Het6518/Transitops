import { Prisma, Session, User } from '@prisma/client';
import { prisma } from '../../../config/database';

export type UserWithPermissions = User & {
  userPermissions: Array<{
    permission: { name: string };
  }>;
};

export class AuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findUserWithPermissions(id: string): Promise<UserWithPermissions | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        userPermissions: {
          where: {
            granted: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          include: { permission: { select: { name: true } } },
        },
      },
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async createSession(data: Prisma.SessionUncheckedCreateInput): Promise<Session> {
    return prisma.session.create({ data });
  }

  async findSessionByRefreshToken(refreshToken: string): Promise<Session | null> {
    return prisma.session.findUnique({ where: { refreshToken } });
  }

  async findSessionById(id: string): Promise<Session | null> {
    return prisma.session.findUnique({ where: { id } });
  }

  async revokeSession(sessionId: string): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async deleteExpiredSessions(): Promise<number> {
    const { count } = await prisma.session.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }],
      },
    });
    return count;
  }

  async createAuditLog(data: {
    userId?: string;
    action: 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'PROFILE_UPDATE';
    module: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        module: data.module,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        ...(data.metadata ? { metadata: data.metadata as Prisma.InputJsonValue } : {}),
        ...(data.userId ? { userId: data.userId } : {}),
      },
    });
  }
}

export const authRepository = new AuthRepository();
