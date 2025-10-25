export class ApplicationError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = statusCode;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message, details = {}) {
    super(message, 422, details);
  }
}

export class ModerationError extends ValidationError {
  constructor(message, details = {}) {
    super(message, details);
    this.name = 'ModerationError';
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

export class ServiceUnavailableError extends ApplicationError {
  constructor(message = 'Service temporarily unavailable', details = {}) {
    super(message, 503, details);
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message, details = {}) {
    super(message, 403, details);
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message = 'Authentication required', details = {}) {
    super(message, 401, details);
  }
}

export class OrderNotFoundError extends NotFoundError {
  constructor(message = 'Company order not found.', details = {}) {
    super(message, { code: 'ORDER_NOT_FOUND', ...details });
    this.name = 'OrderNotFoundError';
  }
}

export class OrderAuthorizationError extends AuthorizationError {
  constructor(message = 'You do not have permission to manage this order.', details = {}) {
    super(message, { code: 'ORDER_FORBIDDEN', ...details });
    this.name = 'OrderAuthorizationError';
  }
}

export class OrderEscrowAccessError extends AuthorizationError {
  constructor(message = 'Escrow actions for this order are locked.', details = {}) {
    super(message, { code: 'ESCROW_LOCKED', ...details });
    this.name = 'OrderEscrowAccessError';
  }
}

export class OrderMessagingAccessError extends AuthorizationError {
  constructor(message = 'Messaging for this order is restricted.', details = {}) {
    super(message, { code: 'ORDER_COMMENT_FORBIDDEN', ...details });
    this.name = 'OrderMessagingAccessError';
  }
}

export default {
  ApplicationError,
  ValidationError,
  ModerationError,
  NotFoundError,
  ConflictError,
  ServiceUnavailableError,
  AuthorizationError,
  AuthenticationError,
  OrderNotFoundError,
  OrderAuthorizationError,
  OrderEscrowAccessError,
  OrderMessagingAccessError,
};
