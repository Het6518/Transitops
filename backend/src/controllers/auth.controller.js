const bcrypt     = require('bcrypt');
const jwt        = require('jsonwebtoken');
const { z }      = require('zod');
const prisma     = require('../prisma/client');
const { zodMessage } = require('../utils/zodMessage');

const BCRYPT_ROUNDS = 10;

// ─── Validation Schemas ───────────────────────────────────────────────────────

const signupSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roleName: z.enum(['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /auth/signup
 * Body: { email, password, roleName }
 */
async function signup(req, res, next) {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) },
      });
    }

    const { email, password, roleName } = parsed.data;

    // Resolve the role from DB
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      return res.status(400).json({
        error: { code: 'INVALID_ROLE', message: `Role '${roleName}' not found` },
      });
    }

    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists' },
      });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: { email, passwordHash, roleId: role.id },
      select: { id: true, email: true, roleId: true, createdAt: true },
    });

    const token = jwt.sign(
      { userId: user.id, roleId: user.roleId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, role: roleName, createdAt: user.createdAt },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/login
 * Body: { email, password }
 */
async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) },
      });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    // Generic message — don't reveal whether email exists
    const INVALID_MSG = 'Invalid email or password';

    if (!user) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: INVALID_MSG } });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: INVALID_MSG } });
    }

    const token = jwt.sign(
      { userId: user.id, roleId: user.roleId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.status(200).json({
      token,
      user: {
        id:    user.id,
        email: user.email,
        role:  user.role.name,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login };
