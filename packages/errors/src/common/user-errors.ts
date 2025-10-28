import { SoranixError } from '../errors/soranix-error.js';

/**
 * Base error class for user-related errors
 */
export class UserError extends SoranixError {
  constructor(code: string, message: string, context?: Record<string, any>) {
    super(code, message, 400, { context });
    this.name = 'UserError';
  }
}

/**
 * Email already exists error
 */
export class EmailAlreadyExistsError extends UserError {
  constructor(email: string) {
    super('EMAIL_ALREADY_EXISTS', `Email ${email} is already registered`, {
      email,
      field: 'email',
    });
  }
}

/**
 * Invalid user data error
 */
export class InvalidUserDataError extends UserError {
  constructor(field: string, value: any, reason?: string) {
    const message = reason ? `Invalid ${field}: ${reason}` : `Invalid ${field}: ${value}`;

    super('INVALID_USER_DATA', message, {
      field,
      value,
      reason,
    });
  }
}

/**
 * User profile not found error
 */
export class UserProfileNotFoundError extends UserError {
  constructor(userId: string) {
    super('USER_PROFILE_NOT_FOUND', `User profile for ${userId} not found`, {
      userId,
      field: 'userId',
    });
  }
}

/**
 * User already active error
 */
export class UserAlreadyActiveError extends UserError {
  constructor(userId: string) {
    super('USER_ALREADY_ACTIVE', `User ${userId} is already active`, {
      userId,
      field: 'status',
    });
  }
}

/**
 * User deactivated error
 */
export class UserDeactivatedError extends UserError {
  constructor(userId: string, reason?: string) {
    super('USER_DEACTIVATED', `User ${userId} is deactivated`, {
      userId,
      reason,
      field: 'status',
    });
  }
}
