/**
 * Shared custom error classes.
 * The centralized error handler in app.js reads .status and .code from these.
 */

class AppError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code   = code;
  }
}

class NotFoundError extends AppError {
  constructor(message) { super(message, 404, 'NOT_FOUND'); }
}

class ConflictError extends AppError {
  constructor(message) { super(message, 409, 'CONFLICT'); }
}

class ForbiddenError extends AppError {
  constructor(message) { super(message, 403, 'FORBIDDEN'); }
}

class ValidationError extends AppError {
  constructor(message) { super(message, 400, 'VALIDATION_ERROR'); }
}

module.exports = { AppError, NotFoundError, ConflictError, ForbiddenError, ValidationError };
