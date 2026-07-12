import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@prisma/client';
import { authRepository } from './auth.repository';
import { verifyPassword } from '../../../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  parseDurationMs,
} from '../../../utils/jwt';
import { AppError, UnauthorizedError } from '../../../middleware/error.middleware';
import { env } from '../../../config/env';

// ============================================================
// DTOs
// ============================================================

export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar: string | null;
  permissions: string[];
}

export interface LoginResult {
  user: AuthUser;
  tokens: AuthTokens;
}

// ============================================================
// Service
// ============================================================

export class AuthService {
  async login(input: LoginInput): Promise<LoginResult> {
    const { email, password, rememberMe = false, ipAddress, userAgent } = input;

    // 1. Find user
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      // Timing-safe: still run compare to prevent enumeration
      await verifyPassword(password, '$2a$12$fakefakefakefakefakefakefakefakefakefakefakefakefakefa');
      throw new UnauthorizedError('Invalid email or password');
    }

    // 2. Check account status
    if (user.status !== 'ACTIVE') {
      throw new AppError(
        `Your account is ${user.status.toLowerCase()}. Please contact support.`,
        403,
      );
    }

    // 3. Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 4. Create session
    const sessionId = uuidv4();
    const refreshExpiry = rememberMe
      ? parseDurationMs('30d')
      : parseDurationMs(env.JWT_REFRESH_EXPIRES_IN);

    // 5. Sign tokens using pre-generated session ID
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    });

    const refreshToken = signRefreshToken({ sub: user.id, sessionId });

    // 6. Persist session
    await authRepository.createSession({
      id: sessionId,
      userId: user.id,
      refreshToken,
      userAgent: userAgent ?? null,
      ipAddress: ipAddress ?? null,
      isRevoked: false,
      expiresAt: new Date(Date.now() + refreshExpiry),
    });

    // 7. Update last login
    await authRepository.updateLastLogin(user.id);

    // 8. Fetch permissions
    const userWithPerms = await authRepository.findUserWithPermissions(user.id);
    const permissions = userWithPerms?.userPermissions.map((up) => up.permission.name) ?? [];

    // 9. Audit log
    await authRepository.createAuditLog({
      userId: user.id,
      action: 'LOGIN',
      module: 'auth',
      ipAddress,
      userAgent,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        permissions,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: parseDurationMs(env.JWT_ACCESS_EXPIRES_IN),
        tokenType: 'Bearer',
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    // 1. Look up session
    const session = await authRepository.findSessionByRefreshToken(refreshToken);
    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token. Please login again.');
    }

    // 2. Verify JWT
    let payload: ReturnType<typeof verifyRefreshToken>;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      await authRepository.revokeSession(session.id);
      throw new UnauthorizedError('Invalid refresh token');
    }

    // 3. Fetch user
    const user = await authRepository.findUserById(payload.sub);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User not found or inactive');
    }

    // 4. Issue new access token (same session)
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    });

    return {
      accessToken,
      refreshToken, // Refresh token rotation can be added here
      expiresIn: parseDurationMs(env.JWT_ACCESS_EXPIRES_IN),
      tokenType: 'Bearer',
    };
  }

  async logout(sessionId: string, userId: string): Promise<void> {
    await authRepository.revokeSession(sessionId);
    await authRepository.createAuditLog({
      userId,
      action: 'LOGOUT',
      module: 'auth',
    });
  }

  async getProfile(userId: string): Promise<AuthUser & { lastLoginAt: Date | null }> {
    const user = await authRepository.findUserWithPermissions(userId);
    if (!user) throw new AppError('User not found', 404);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      permissions: user.userPermissions.map((up) => up.permission.name),
      lastLoginAt: user.lastLoginAt,
    };
  }
}

export const authService = new AuthService();
