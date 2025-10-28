import { SoranixError } from '../errors/soranix-error.js';

/**
 * Base error class for authentication-related errors
 */
export class AuthError extends SoranixError {
  constructor(code: string, message: string, context?: Record<string, any>) {
    super(code, message, 401, { context });
    this.name = 'AuthError';
  }
}

/**
 * User not found error
 */
export class UserNotFoundError extends AuthError {
  constructor(userId: string) {
    super('USER_NOT_FOUND', `User with ID ${userId} not found`, {
      userId,
      field: 'userId',
    });
  }
}

/**
 * Invalid credentials error
 */
export class InvalidCredentialsError extends AuthError {
  constructor(email: string) {
    super('INVALID_CREDENTIALS', 'Invalid email or password', {
      email,
      field: 'credentials',
    });
  }
}

/**
 * Token expired error
 */
export class TokenExpiredError extends AuthError {
  constructor(tokenType: string = 'access') {
    super('TOKEN_EXPIRED', `${tokenType} token has expired`, {
      tokenType,
      field: 'token',
    });
  }
}

/**
 * Invalid token error
 */
export class InvalidTokenError extends AuthError {
  constructor(tokenType: string = 'access') {
    super('INVALID_TOKEN', `Invalid ${tokenType} token`, {
      tokenType,
      field: 'token',
    });
  }
}

/**
 * Account locked error
 */
export class AccountLockedError extends AuthError {
  constructor(userId: string, reason: string) {
    super('ACCOUNT_LOCKED', 'Account is locked', {
      userId,
      reason,
      field: 'account',
    });
  }
}
