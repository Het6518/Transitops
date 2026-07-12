import { Router } from 'express';
import { login, logout, refresh, getProfile } from './auth.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { validate, loginSchema, refreshSchema } from './auth.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & authorization endpoints
 */

// Public routes
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);

export default router;
