import { BaseEvent, EventConfig, EventPriority, DeliveryGuarantee } from '../types/base-event.js';
import type { EventTransportConfig } from '../transports/types.js';
import { EXCHANGES } from '../transports/constants.js';

/**
 * Auth Service Events
 *
 * These events are published by the auth service and consumed by other services.
 * Changes to these events affect all consuming services.
 */

export interface RegisterUserData {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  country?: string;
}

export interface RegisterUserEvent extends BaseEvent {
  eventType: 'auth.user.registered';
  data: RegisterUserData;
}

export interface EmailVerificationRequestedData {
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
}

export interface EmailVerificationRequestedEvent extends BaseEvent {
  eventType: 'auth.email.verification.requested';
  data: EmailVerificationRequestedData;
}

export const AUTH_EVENT_CONFIG: Record<string, EventConfig> = {
  'auth.user.registered': {
    priority: EventPriority.HIGH,
    deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
    requiresEncryption: true,
    ttl: 604800000,
    maxRetries: 3,
  },
  'auth.email.verification.requested': {
    priority: EventPriority.HIGH,
    deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
    requiresEncryption: false,
    ttl: 300000,
    maxRetries: 3,
  },
};

/**
 * Transport configurations for auth events (defaults)
 * Services can override these in their EventBus configuration
 */
export const AUTH_EVENT_TRANSPORT_CONFIGS: Record<string, EventTransportConfig> = {
  'auth.user.registered': {
    rabbitmq: {
      exchange: EXCHANGES.AUTH,
      routingKey: 'auth.user.registered',
      queue: {
        template: 'default',
      },
    },
  },
  'auth.email.verification.requested': {
    rabbitmq: {
      exchange: EXCHANGES.AUTH,
      routingKey: 'auth.email.verification.requested',
      queue: {
        template: 'default',
        arguments: {
          'x-message-ttl': 300000,
        },
      },
    },
  },
} as const;
