import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

// ============================================================
// Custom Error Classes
// ============================================================

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 400, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden. You do not have permission to perform this action.') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'A record with this value already exists') {
    super(message, 409);
  }
}

export class ValidationError extends AppError {
  errors?: unknown;
  constructor(message = 'Validation failed', errors?: unknown) {
    super(message, 422);
    this.errors = errors;
  }
}

export class UnprocessableError extends AppError {
  constructor(message = 'Unprocessable entity') {
    super(message, 422);
  }
}

// ============================================================
// Global Error Handler Middleware
// ============================================================

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): Response => {
  // Log all errors
  logger.error({
    message: error.message,
    name: error.name,
    stack: error.stack,
    path: req.path,
    method: req.method,
    requestId: (req as any).requestId,
    userId: (req as any).user?.id,
  });

  // Zod validation
  if (error instanceof ZodError) {
    return sendError(
      res,
      'Validation failed',
      422,
      error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      })),
    );
  }

  // App operational errors
  if (error instanceof ValidationError) {
    return sendError(res, error.message, error.statusCode, error.errors);
  }
  if (error instanceof AppError) {
    return sendError(res, error.message, error.statusCode);
  }

  // JWT errors
  if (error instanceof TokenExpiredError) {
    return sendError(res, 'Token has expired. Please login again.', 401);
  }
  if (error instanceof JsonWebTokenError) {
    return sendError(res, 'Invalid token', 401);
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return sendError(res, 'A record with this value already exists', 409);
      case 'P2025':
        return sendError(res, 'Record not found', 404);
      case 'P2003':
        return sendError(res, 'Related record not found', 400);
      case 'P2014':
        return sendError(res, 'The change would violate a required relation', 400);
      default:
        return sendError(res, 'Database error', 500);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return sendError(res, 'Invalid data provided to the database', 400);
  }

  // Unknown error
  return sendError(res, 'An unexpected error occurred. Please try again.', 500);
};

// ============================================================
// 404 Handler
// ============================================================

export const notFoundHandler = (req: Request, res: Response): Response => {
  return sendError(res, `Route ${req.method} ${req.path} not found`, 404);
};
