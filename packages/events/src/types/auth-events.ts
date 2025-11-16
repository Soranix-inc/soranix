import { BaseEvent, EventPriority, DeliveryGuarantee } from './base-event.js';

// ============================================
// Auth Event Interfaces
// ============================================

export interface UserRegistrationRequestedData {
  tempId: string;
  email: string;
  firstName: string;
  lastName: string;
  registrationToken: string;
}

export interface EmailVerificationRequestedData {
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
}

export interface EmailVerifiedData {
  userId: string;
  email: string;
  verifiedAt: string;
}

export interface PasswordResetRequestedData {
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
  ipAddress?: string;
}

export interface PasswordChangedData {
  userId: string;
  email: string;
  changedAt: string;
  reason: 'reset' | 'user_initiated' | 'admin_forced';
}

export interface UserLoggedInData {
  userId: string;
  email: string;
  sessionId: string;
  deviceId: string;
  deviceInfo: {
    deviceType: string;
    browser: string;
    os: string;
    ipAddress: string;
    userAgent: string;
  };
  timestamp: string;
}

export interface UserLoggedOutData {
  userId: string;
  sessionId: string;
  deviceId: string;
  timestamp: string;
  reason: 'user_initiated' | 'token_expired' | 'security_logout';
}

export interface AccountLockedData {
  userId: string;
  email: string;
  reason: 'max_login_attempts' | 'suspicious_activity' | 'admin_action';
  lockedUntil: string;
  attemptCount?: number;
}

export interface AccountUnlockedData {
  userId: string;
  email: string;
  unlockedBy: 'auto_expiry' | 'admin_action' | 'password_reset';
  timestamp: string;
}

export interface MFAEnabledData {
  userId: string;
  email: string;
  mfaType: 'totp' | 'sms' | 'email';
  enabledAt: string;
}

export interface MFADisabledData {
  userId: string;
  email: string;
  disabledAt: string;
  reason: 'user_requested' | 'admin_action' | 'account_recovery';
}

export interface SessionRevokedData {
  userId: string;
  sessionId: string;
  deviceId: string;
  revokedBy: 'user' | 'admin' | 'system';
  reason: string;
  timestamp: string;
}

export interface AllSessionsRevokedData {
  userId: string;
  sessionCount: number;
  revokedBy: 'user' | 'admin' | 'system';
  reason: string;
  timestamp: string;
}

export interface RefreshTokenRotatedData {
  userId: string;
  sessionId: string;
  oldTokenVersion: number;
  newTokenVersion: number;
  timestamp: string;
}

// ============================================
// Event Classes
// ============================================

export class UserRegistrationRequestedEvent extends BaseEvent {
  constructor(data: UserRegistrationRequestedData) {
    super('auth.user.registration.requested', data, {
      priority: EventPriority.HIGH,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      encrypted: false,
      ttl: 300000, // 5 minutes
    });
  }
}

export class EmailVerificationRequestedEvent extends BaseEvent {
  constructor(data: EmailVerificationRequestedData) {
    super('auth.email.verification.requested', data, {
      priority: EventPriority.HIGH,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      encrypted: false,
    });
  }
}

export class EmailVerifiedEvent extends BaseEvent {
  constructor(data: EmailVerifiedData) {
    super('auth.email.verified', data, {
      priority: EventPriority.MEDIUM,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      encrypted: false,
    });
  }
}

export class PasswordResetRequestedEvent extends BaseEvent {
  constructor(data: PasswordResetRequestedData) {
    super('auth.password.reset.requested', data, {
      priority: EventPriority.HIGH,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      encrypted: true,
      ttl: 300000, // 5 minutes
    });
  }
}

export class PasswordChangedEvent extends BaseEvent {
  constructor(data: PasswordChangedData) {
    super('auth.password.changed', data, {
      priority: EventPriority.HIGH,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      encrypted: false,
    });
  }
}

export class UserLoggedInEvent extends BaseEvent {
  constructor(data: UserLoggedInData) {
    super('auth.user.logged.in', data, {
      priority: EventPriority.LOW,
      deliveryGuarantee: DeliveryGuarantee.AT_MOST_ONCE,
      encrypted: false,
    });
  }
}

export class UserLoggedOutEvent extends BaseEvent {
  constructor(data: UserLoggedOutData) {
    super('auth.user.logged.out', data, {
      priority: EventPriority.LOW,
      deliveryGuarantee: DeliveryGuarantee.AT_MOST_ONCE,
      encrypted: false,
    });
  }
}

export class AccountLockedEvent extends BaseEvent {
  constructor(data: AccountLockedData) {
    super('auth.account.locked', data, {
      priority: EventPriority.HIGH,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      encrypted: false,
    });
  }
}

export class AccountUnlockedEvent extends BaseEvent {
  constructor(data: AccountUnlockedData) {
    super('auth.account.unlocked', data, {
      priority: EventPriority.MEDIUM,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      encrypted: false,
    });
  }
}

export class MFAEnabledEvent extends BaseEvent {
  constructor(data: MFAEnabledData) {
    super('auth.mfa.enabled', data, {
      priority: EventPriority.MEDIUM,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      encrypted: false,
    });
  }
}

export class MFADisabledEvent extends BaseEvent {
  constructor(data: MFADisabledData) {
    super('auth.mfa.disabled', data, {
      priority: EventPriority.MEDIUM,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      encrypted: false,
    });
  }
}

export class SessionRevokedEvent extends BaseEvent {
  constructor(data: SessionRevokedData) {
    super('auth.session.revoked', data, {
      priority: EventPriority.MEDIUM,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      encrypted: false,
    });
  }
}

export class AllSessionsRevokedEvent extends BaseEvent {
  constructor(data: AllSessionsRevokedData) {
    super('auth.sessions.all.revoked', data, {
      priority: EventPriority.HIGH,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      encrypted: false,
    });
  }
}

export class RefreshTokenRotatedEvent extends BaseEvent {
  constructor(data: RefreshTokenRotatedData) {
    super('auth.token.refresh.rotated', data, {
      priority: EventPriority.LOW,
      deliveryGuarantee: DeliveryGuarantee.AT_MOST_ONCE,
      encrypted: false,
    });
  }
}

// ============================================
// Event Factory Functions
// ============================================

export const createUserRegistrationRequestedEvent = (data: UserRegistrationRequestedData) =>
  new UserRegistrationRequestedEvent(data);

export const createEmailVerificationRequestedEvent = (data: EmailVerificationRequestedData) =>
  new EmailVerificationRequestedEvent(data);

export const createEmailVerifiedEvent = (data: EmailVerifiedData) => new EmailVerifiedEvent(data);

export const createPasswordResetRequestedEvent = (data: PasswordResetRequestedData) =>
  new PasswordResetRequestedEvent(data);

export const createPasswordChangedEvent = (data: PasswordChangedData) => new PasswordChangedEvent(data);

export const createUserLoggedInEvent = (data: UserLoggedInData) => new UserLoggedInEvent(data);

export const createUserLoggedOutEvent = (data: UserLoggedOutData) => new UserLoggedOutEvent(data);

export const createAccountLockedEvent = (data: AccountLockedData) => new AccountLockedEvent(data);

export const createAccountUnlockedEvent = (data: AccountUnlockedData) => new AccountUnlockedEvent(data);

export const createMFAEnabledEvent = (data: MFAEnabledData) => new MFAEnabledEvent(data);

export const createMFADisabledEvent = (data: MFADisabledData) => new MFADisabledEvent(data);

export const createSessionRevokedEvent = (data: SessionRevokedData) => new SessionRevokedEvent(data);

export const createAllSessionsRevokedEvent = (data: AllSessionsRevokedData) => new AllSessionsRevokedEvent(data);

export const createRefreshTokenRotatedEvent = (data: RefreshTokenRotatedData) => new RefreshTokenRotatedEvent(data);

