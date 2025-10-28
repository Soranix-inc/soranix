/**
 * Base authentication error
 */
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Token missing error
 */
export class TokenMissingError extends AuthenticationError {
  constructor(message: string = 'Authentication token is missing') {
    super(message, 401);
    this.name = 'TokenMissingError';
    Object.setPrototypeOf(this, TokenMissingError.prototype);
  }
}

/**
 * Token invalid error
 */
export class TokenInvalidError extends AuthenticationError {
  constructor(message: string = 'Authentication token is invalid') {
    super(message, 401);
    this.name = 'TokenInvalidError';
    Object.setPrototypeOf(this, TokenInvalidError.prototype);
  }
}

/**
 * Token expired error
 */
export class TokenExpiredError extends AuthenticationError {
  constructor(message: string = 'Authentication token has expired') {
    super(message, 401);
    this.name = 'TokenExpiredError';
    Object.setPrototypeOf(this, TokenExpiredError.prototype);
  }
}

/**
 * Insufficient permissions error
 */
export class InsufficientPermissionsError extends AuthenticationError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'InsufficientPermissionsError';
    Object.setPrototypeOf(this, InsufficientPermissionsError.prototype);
  }
}
