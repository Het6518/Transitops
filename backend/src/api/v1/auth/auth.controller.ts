import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/response';
import { authService } from './auth.service';

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *               rememberMe: { type: boolean }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password, rememberMe } = req.body as {
    email: string;
    password: string;
    rememberMe?: boolean;
  };

  const result = await authService.login({
    email,
    password,
    rememberMe,
    ipAddress: req.ip ?? req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  sendSuccess(res, result, 'Login successful');
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token using a valid refresh token
 *     security: []
 */
export const refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken: string };
  const tokens = await authService.refresh(refreshToken);
  sendSuccess(res, tokens, 'Token refreshed successfully');
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and revoke session
 *     security:
 *       - bearerAuth: []
 */
export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await authService.logout(req.user!.sessionId, req.user!.id);
  sendSuccess(res, null, 'Logged out successfully');
});

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Get the authenticated user's profile
 *     security:
 *       - bearerAuth: []
 */
export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const profile = await authService.getProfile(req.user!.id);
  sendSuccess(res, profile, 'Profile retrieved');
});
