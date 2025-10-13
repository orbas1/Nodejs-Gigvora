export class ApplicationError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message, details = {}) {
    super(message, 422, details);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message, details = {}) {
    super(message, 404, details);
  }
}

export class ConflictError extends ApplicationError {
  constructor(message, details = {}) {
    super(message, 409, details);
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message, details = {}) {
    super(message, 403, details);
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message, details = {}) {
  constructor(message = 'Authentication required', details = {}) {
    super(message, 401, details);
  }
}

export default {
  ApplicationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError,
  AuthenticationError,
};
