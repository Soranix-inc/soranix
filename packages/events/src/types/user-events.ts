import { BaseEvent, EventConfig, EventPriority, DeliveryGuarantee } from './base-event.js';

// User Event Interfaces
export interface UserRegisteredData {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  metadata?: Record<string, any>;
}

export interface UserLoginData extends UserRegisteredData {
  loginMethod: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserLogoutData extends UserRegisteredData {
  sessionId: string;
  logoutReason?: string;
}

export interface UserProfileUpdatedData extends UserRegisteredData {
  updatedFields: string[];
  previousValues?: Record<string, any>;
}

export interface UserPasswordChangedData extends UserRegisteredData {
  changeReason?: string;
  ipAddress?: string;
}

export interface SessionExpiredData extends UserRegisteredData {
  sessionId: string;
  expiredAt: Date;
  reason?: string;
}

// User Event Types
export interface UserRegisteredEvent extends BaseEvent {
  eventType: 'user.registered';
  data: UserRegisteredData;
}

export interface UserLoginEvent extends BaseEvent {
  eventType: 'user.login';
  data: UserLoginData;
}

export interface UserLogoutEvent extends BaseEvent {
  eventType: 'user.logout';
  data: UserLogoutData;
}

export interface UserProfileUpdatedEvent extends BaseEvent {
  eventType: 'user.profile.updated';
  data: UserProfileUpdatedData;
}

export interface UserPasswordChangedEvent extends BaseEvent {
  eventType: 'user.password.changed';
  data: UserPasswordChangedData;
}

export interface SessionExpiredEvent extends BaseEvent {
  eventType: 'session.expired';
  data: SessionExpiredData;
}

// User Event Configuration
export const USER_EVENT_CONFIG: Record<string, EventConfig> = {
  'user.registered': {
    priority: EventPriority.HIGH,
    deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
    requiresEncryption: true,
    ttl: 604800000, // 7 days
    maxRetries: 3,
  },
  'user.login': {
    priority: EventPriority.NORMAL,
    deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
    requiresEncryption: false,
    ttl: 604800000, // 7 days
    maxRetries: 2,
  },
  'user.logout': {
    priority: EventPriority.LOW,
    deliveryGuarantee: DeliveryGuarantee.BEST_EFFORT,
    requiresEncryption: false,
    ttl: 604800000, // 7 days
    maxRetries: 1,
  },
  'user.profile.updated': {
    priority: EventPriority.NORMAL,
    deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
    requiresEncryption: true,
    ttl: 604800000, // 7 days
    maxRetries: 2,
  },
  'user.password.changed': {
    priority: EventPriority.HIGH,
    deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
    requiresEncryption: true,
    ttl: 604800000, // 7 days
    maxRetries: 3,
  },
  'session.expired': {
    priority: EventPriority.NORMAL,
    deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
    requiresEncryption: false,
    ttl: 604800000, // 7 days
    maxRetries: 2,
  },
};
